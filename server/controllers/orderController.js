import stripe from "stripe";
import { Op } from 'sequelize';
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const getCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data, ttl = CACHE_TTL) => {
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, expires: Date.now() + ttl });
};

const clearOrderCaches = (userId = null) => {
  for (const [key] of cache) {
    if (key.startsWith('user_orders:') || key.startsWith('all_orders:')) {
      if (!userId || key.includes(userId)) {
        cache.delete(key);
      }
    }
  }
};

// Place Order COD : POST /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { items, addressId } = req.body;
    const userId = req.userId;

    if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data provided" });
    }

    // Verify address belongs to user
    const address = await Address.findOne({
      where: { id: addressId, userId: userId },
      attributes: ['id']
    });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Batch fetch all products in ONE query (fixes N+1 problem)
    const productIds = [...new Set(items.map(item => item.product))];
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ['id', 'name', 'price', 'offerPrice', 'inStock']
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    let amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = productMap.get(parseInt(item.product));
      if (!product || !product.inStock) {
        return res.status(400).json({ success: false, message: `Product unavailable: ${item.product}` });
      }
      
      const price = product.offerPrice || product.price;
      const quantity = parseInt(item.quantity);
      
      if (!price || price <= 0 || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Invalid price or quantity" });
      }

      amount += price * quantity;
      validatedItems.push({ product: item.product, quantity, price });
    }
    
    const taxAmount = Math.floor(amount * 0.15);
    const totalAmount = amount + taxAmount;

    const order = await Order.create({
      userId,
      items: validatedItems,
      amount: totalAmount,
      addressId,
      paymentType: "COD",
    });

    clearOrderCaches(userId);

    return res.status(201).json({ success: true, message: "Order placed successfully", orderId: order.id });
  } catch (error) {
    console.error("COD Order error:", error);
    return res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// Place Order Stripe : POST /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const { items, addressId } = req.body;
    const userId = req.userId;
    const { origin } = req.headers;

    console.log('Stripe Order Request:', { userId, addressId, items, origin });

    if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
      console.log('Invalid request data:', { userId, addressId, itemsLength: items?.length });
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return res.status(500).json({ success: false, message: "Payment system not configured" });
    }

    // Verify address
    const address = await Address.findOne({
      where: { id: addressId, userId: userId },
      attributes: ['id']
    });

    if (!address) {
      console.log('Address not found:', { addressId, userId });
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Batch fetch products and calculate amount (fixes N+1 problem)
    const productIds = [...new Set(items.map(item => item.product))];
    console.log('Fetching products with IDs:', productIds);
    
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ['id', 'name', 'price', 'offerPrice', 'inStock']
    });

    console.log('Found products:', products.length);

    if (products.length !== productIds.length) {
      console.log('Some products not found. Expected:', productIds.length, 'Found:', products.length);
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    let amount = 0;
    const productData = [];
    const validatedItems = [];
    
    for (const item of items) {
      const productId = parseInt(item.product);
      const product = productMap.get(productId);
      
      if (!product) {
        console.log('Product not found:', productId);
        return res.status(400).json({ success: false, message: `Product not found: ${productId}` });
      }
      
      if (!product.inStock) {
        console.log('Product out of stock:', productId);
        return res.status(400).json({ success: false, message: `Product out of stock: ${product.name}` });
      }
      
      const price = product.offerPrice || product.price;
      const quantity = parseInt(item.quantity);
      
      if (!price || price <= 0) {
        console.log('Invalid price for product:', productId, price);
        return res.status(400).json({ success: false, message: `Invalid price for product: ${product.name}` });
      }
      
      if (!quantity || quantity <= 0) {
        console.log('Invalid quantity:', quantity);
        return res.status(400).json({ success: false, message: "Invalid quantity" });
      }
      
      productData.push({ name: product.name, price, quantity });
      validatedItems.push({ product: item.product, quantity, price });
      amount += price * quantity;
    }

    const taxAmount = Math.floor(amount * 0.15);
    const totalAmount = amount + taxAmount;

    console.log('Order totals:', { amount, taxAmount, totalAmount });

    // Create order
    const order = await Order.create({
      userId,
      items: validatedItems, // Use validated items instead of original items
      amount: totalAmount,
      addressId,
      paymentType: "Online",
    });

    console.log('Order created:', order.id);

    // Initialize Stripe
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Build line items - Fix potential pricing issues
    const line_items = productData.map((p) => {
      // Ensure price is in cents and is a valid number
      const priceInCents = Math.round((p.price * 100)); // Remove the 2% fee for now to test
      
      console.log(`Product: ${p.name}, Price: ${p.price}, Price in cents: ${priceInCents}`);
      
      return {
        price_data: {
          currency: "usd", // Make sure your Stripe account supports USD
          product_data: { 
            name: p.name 
          },
          unit_amount: priceInCents,
        },
        quantity: p.quantity,
      };
    });

    console.log('Stripe line items:', JSON.stringify(line_items, null, 2));

    // Determine success and cancel URLs
    const successUrl = origin ? `${origin}/loader?next=my-orders` : `${req.protocol}://${req.get('host')}/loader?next=my-orders`;
    const cancelUrl = origin ? `${origin}/cart` : `${req.protocol}://${req.get('host')}/cart`;

    console.log('Redirect URLs:', { successUrl, cancelUrl });

    // Create Stripe session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'], // Explicitly specify payment methods
      line_items,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: order.id.toString(),
        userId: userId.toString(),
      },
    });

    console.log('Stripe session created:', session.id);

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Order error:", error);
    
    // More detailed error logging
    if (error.type) {
      console.error("Stripe error type:", error.type);
      console.error("Stripe error message:", error.message);
      console.error("Stripe error code:", error.code);
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create payment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Stripe Webhooks : POST /stripe
export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });
      const { orderId, userId } = session.data[0].metadata;

      // Mark Order as paid
      await Order.update({ isPaid: true }, { where: { id: orderId } });
      
      // Clear user's cart
      await User.update({ cartItems: {} }, { where: { id: userId } });
      
      clearOrderCaches(userId);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });
      const { orderId, userId } = session.data[0].metadata;
      await Order.destroy({ where: { id: orderId } });
      clearOrderCaches(userId);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
      break;
  }

  response.json({ received: true });
};

// Update Order Status: PUT /api/order/status/:orderId
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Order Placed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Valid: " + validStatuses.join(', ') 
      });
    }

    const updateData = { status };
    if (status === 'Shipped') updateData.shippedAt = new Date();
    if (status === 'Delivered') updateData.deliveredAt = new Date();

    const [updatedRowsCount] = await Order.update(updateData, { where: { id: orderId } });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    clearOrderCaches();
    return res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

// Get Orders by User ID : GET /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const cacheKey = `user_orders:${userId}:${pageNum}:${limitNum}`;
    
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const orders = await Order.findAll({
      where: {
        userId,
        [Op.or]: [{ paymentType: "COD" }, { isPaid: true }]
      },
      include: [
        {
          model: Address,
          as: 'address',
          attributes: ['id', 'firstName', 'lastName', 'street', 'city', 'parish', 'country', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    // BIG FIX: Get ALL product IDs from ALL orders in ONE query
    const allProductIds = [...new Set(
      orders.flatMap(order => order.items.map(item => parseInt(item.product)))
    )];

    // ONE database query instead of N queries
    const products = await Product.findAll({
      where: { id: { [Op.in]: allProductIds } },
      attributes: ['id', 'name', 'category', 'image', 'offerPrice', 'price']
    });

    const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

    // Process orders efficiently
    const processedOrders = orders.map(order => {
      const orderObj = order.toJSON();
      
      const processedItems = orderObj.items.map(item => ({
        ...item,
        product: productMap.get(parseInt(item.product)) ? {
          ...productMap.get(parseInt(item.product)),
          _id: item.product
        } : null
      }));

      return {
        ...orderObj,
        _id: orderObj.id,
        items: processedItems
      };
    });

    const responseData = { success: true, orders: processedOrders };
    setCache(cacheKey, responseData);

    return res.json(responseData);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Get All Orders (for seller/admin) : GET /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    
    const cacheKey = `all_orders:${pageNum}:${limitNum}:${status || 'all'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const whereClause = {
      [Op.or]: [{ paymentType: "COD" }, { isPaid: true }]
    };
    if (status) whereClause.status = status;

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Address,
          as: 'address',
          attributes: ['id', 'firstName', 'lastName', 'street', 'city', 'parish', 'country', 'phone']
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    // BIG FIX: Get ALL product IDs from ALL orders in ONE query
    const allProductIds = [...new Set(
      orders.flatMap(order => order.items.map(item => parseInt(item.product)))
    )];

    // ONE database query instead of N queries
    const products = await Product.findAll({
      where: { id: { [Op.in]: allProductIds } },
      attributes: ['id', 'name', 'category', 'image', 'offerPrice', 'price']
    });

    const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

    // Process orders efficiently
    const processedOrders = orders.map(order => {
      const orderObj = order.toJSON();
      
      const processedItems = orderObj.items.map(item => ({
        ...item,
        product: productMap.get(parseInt(item.product)) ? {
          ...productMap.get(parseInt(item.product)),
          _id: item.product
        } : null
      }));

      return {
        ...orderObj,
        _id: orderObj.id,
        items: processedItems
      };
    });

    const responseData = { success: true, orders: processedOrders };
    setCache(cacheKey, responseData);

    return res.json(responseData);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};