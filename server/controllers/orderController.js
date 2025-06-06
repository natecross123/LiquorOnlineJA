import stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Place Order COD : POST /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.userId;

    if (!userId || !address || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // 3) Calculate amount
    let amount = await items.reduce(async (accPromise, item) => {
      const acc = await accPromise;
      const product = await Product.findById(item.product);
      return acc + product.offerPrice * item.quantity;
    }, Promise.resolve(0));
    amount += Math.floor(amount * 0.15);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
    });

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Place Order Stripe : POST /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    // 1) Read only items + address from the JSON body
    const { items, address } = req.body;
    const userId = req.userId;
    const { origin } = req.headers;

    if (!userId || !address || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // 2) Gather product details & calculate amount
    let productData = [];
    let amount = await items.reduce(async (accPromise, item) => {
      const acc = await accPromise;
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });
      return acc + product.offerPrice * item.quantity;
    }, Promise.resolve(0));

    // 3) Add 15% tax
    amount += Math.floor(amount * 0.15);

    // 4) Create order record with `paymentType: "Online"`
    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
    });

    // 5) Initialize Stripe
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // 6) Build line_items for Stripe Checkout
    const line_items = productData.map((p) => ({
      price_data: {
        currency: "usd",
        product_data: { name: p.name },
        unit_amount: Math.floor(p.price + p.price * 0.02) * 100,
      },
      quantity: p.quantity,
    }));

    // 7) Create a Stripe session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Stripe Webhooks to Verify Payments : POST /stripe
export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    // Verify signature & parse event
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
      const paymentIntentId = paymentIntent.id;

      // Retrieve the session to get metadata (orderId & userId)
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const { orderId, userId } = session.data[0].metadata;

      // Mark Order as paid
      await Order.findByIdAndUpdate(orderId, { isPaid: true });

      // Clear the user's cart
      await User.findByIdAndUpdate(userId, { cartItems: {} });
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const { orderId } = session.data[0].metadata;
      await Order.findByIdAndDelete(orderId);
      break;
    }

    default:
      console.error(`Unhandled event type ${event.type}`);
      break;
  }

  response.json({ received: true });
};

// Update Order Status: PUT /api/order/status/:orderId
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status values
    const validStatuses = ['Order Placed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.json({ 
        success: false, 
        message: "Invalid status. Valid statuses are: " + validStatuses.join(', ') 
      });
    }

    // Find and update the order
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        ...(status === 'Shipped' && { shippedAt: new Date() }),
        ...(status === 'Delivered' && { deliveredAt: new Date() })
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Here you could add email notification logic
    // sendOrderStatusEmail(order.userId.email, order, status);

    return res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      order 
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Get Orders by User ID : GET /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.json({ success: false, message: "Not authorized" });
    }

    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate({
        path: "items.product",
        match: { _id: { $exists: true } }, // Only populate if product exists
        select: "name category image offerPrice" // Only select needed fields
      })
      .populate("address")
      .sort({ createdAt: -1 });

    // Filter out orders where all products are null and clean up items
    const filteredOrders = orders
      .map(order => {
        // Filter out items with null products
        const validItems = order.items.filter(item => item.product !== null);
        
        if (validItems.length === 0) {
          return null; // Mark order for removal if no valid items
        }
        
        return {
          ...order.toObject(),
          items: validItems
        };
      })
      .filter(order => order !== null); // Remove orders with no valid items

    return res.json({ success: true, orders: filteredOrders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.json({ success: false, message: error.message });
  }
};

// Get All Orders (for seller/admin) : GET /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate({
        path: "items.product",
        match: { _id: { $exists: true } }, // Only populate if product exists
        select: "name category image offerPrice" // Only select needed fields
      })
      .populate("address")
      .sort({ createdAt: -1 });

    // Filter out orders where all products are null and clean up items
    const filteredOrders = orders
      .map(order => {
        // Filter out items with null products
        const validItems = order.items.filter(item => item.product !== null);
        
        if (validItems.length === 0) {
          return null; // Mark order for removal if no valid items
        }
        
        return {
          ...order.toObject(),
          items: validItems
        };
      })
      .filter(order => order !== null); // Remove orders with no valid items

    return res.json({ success: true, orders: filteredOrders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.json({ success: false, message: error.message });
  }
};