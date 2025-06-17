import stripe from "stripe";
import { Op } from 'sequelize';
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js"
import Address from "../models/Address.js";

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

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

    // Batch fetch all products
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

    cache.clear(); // Clear cache on new order

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

    if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // Verify address
    const address = await Address.findOne({
      where: { id: addressId, userId: userId },
      attributes: ['id']
    });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Batch fetch products and calculate amount
    const productIds = [...new Set(items.map(item => item.product))];
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ['id', 'name', 'price', 'offerPrice', 'inStock']
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    let amount = 0;
    const productData = [];
    
    for (const item of items) {
      const product = productMap.get(parseInt(item.product));
      if (!product || !product.inStock) {
        return res.status(400).json({ success: false, message: `Product unavailable: ${item.product}` });
      }
      
      const price = product.offerPrice || product.price;
      const quantity = parseInt(item.quantity);
      
      productData.push({ name: product.name, price, quantity });
      amount += price * quantity;
    }

    const taxAmount = Math.floor(amount * 0.15);
    const totalAmount = amount + taxAmount;

    // Create order
    const order = await Order.create({
      userId,
      items,
      amount: totalAmount,
      addressId,
      paymentType: "Online",
    });

    // Initialize Stripe
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Build line items
    const line_items = productData.map((p) => ({
      price_data: {
        currency: "usd",
        product_data: { name: p.name },
        unit_amount: Math.floor(p.price + p.price * 0.02) * 100,
      },
      quantity: p.quantity,
    }));

    // Create Stripe session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order.id.toString(),
        userId,
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Order error:", error);
    return res.status(500).json({ success: false, message: "Failed to create payment" });
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
      
      cache.clear();
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });
      const { orderId } = session.data[0].metadata;
      await Order.destroy({ where: { id: orderId } });
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

    cache.clear();
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
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
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

    // Process orders to add product details
    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toJSON();
        
        const productIds = orderObj.items.map(item => item.product);
        const products = await Product.findAll({
          where: { id: { [Op.in]: productIds } },
          attributes: ['id', 'name', 'category', 'image', 'offerPrice', 'price']
        });

        const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

        const processedItems = orderObj.items.map(item => ({
          ...item,
          product: productMap.get(item.product) ? {
            ...productMap.get(item.product),
            _id: item.product
          } : null
        }));

        return {
          ...orderObj,
          _id: orderObj.id,
          items: processedItems
        };
      })
    );

    const responseData = { success: true, orders: processedOrders };
    cache.set(cacheKey, { data: responseData, expires: Date.now() + CACHE_TTL });

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
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
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

    // Process orders (same as getUserOrders)
    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toJSON();
        
        const productIds = orderObj.items.map(item => item.product);
        const products = await Product.findAll({
          where: { id: { [Op.in]: productIds } },
          attributes: ['id', 'name', 'category', 'image', 'offerPrice', 'price']
        });

        const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

        const processedItems = orderObj.items.map(item => ({
          ...item,
          product: productMap.get(item.product) ? {
            ...productMap.get(item.product),
            _id: item.product
          } : null
        }));

        return {
          ...orderObj,
          _id: orderObj.id,
          items: processedItems
        };
      })
    );

    const responseData = { success: true, orders: processedOrders };
    cache.set(cacheKey, { data: responseData, expires: Date.now() + CACHE_TTL });

    return res.json(responseData);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};
