import stripe from "stripe";
import { Op } from "sequelize"; // Import Op for Sequelize operators
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";


export const placeOrderCOD = async (req, res) => {
    try {
        const { items, addressId } = req.body;
        const userId = req.userId;

        // Validate required fields
        if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
            return res.json({ 
                success: false, 
                message: "Invalid data. Please provide items and address." 
            });
        }

        // Verify address belongs to user
        const address = await Address.findOne({
            where: { id: addressId, userId }
        });

        if (!address) {
            return res.json({ 
                success: false, 
                message: "Address not found or unauthorized" 
            });
        }

        // Calculate total amount
        let amount = 0;
        for (const item of items) {
            const product = await Product.findByPk(item.product);
            if (!product) {
                return res.json({ 
                    success: false, 
                    message: `Product with ID ${item.product} not found` 
                });
            }
            amount += product.offerPrice * item.quantity;
        }

        // Add 15% tax
        amount += Math.floor(amount * 0.15);

        // Create order
        const order = await Order.create({
            userId,
            items,
            amount,
            addressId,
            paymentType: "COD",
        });

        return res.json({ 
            success: true, 
            message: "Order placed successfully",
            orderId: order.id
        });

    } catch (error) {
        console.error("COD order error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to place order. Please try again." 
        });
    }
};

/**
 * Place Order with Stripe Payment
 * Route: POST /api/order/stripe
 * Access: Private (requires authentication)
 */
export const placeOrderStripe = async (req, res) => {
    try {
        const { items, addressId } = req.body;
        const userId = req.userId;
        const { origin } = req.headers;

        // Validate required fields
        if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
            return res.json({ 
                success: false, 
                message: "Invalid data. Please provide items and address." 
            });
        }

        // Verify address belongs to user
        const address = await Address.findOne({
            where: { id: addressId, userId }
        });

        if (!address) {
            return res.json({ 
                success: false, 
                message: "Address not found or unauthorized" 
            });
        }

        // Gather product details and calculate amount
        let productData = [];
        let amount = 0;

        for (const item of items) {
            const product = await Product.findByPk(item.product);
            if (!product) {
                return res.json({ 
                    success: false, 
                    message: `Product with ID ${item.product} not found` 
                });
            }

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });
            
            amount += product.offerPrice * item.quantity;
        }

        // Add 15% tax
        amount += Math.floor(amount * 0.15);

        // Create order record with paymentType: "Online"
        const order = await Order.create({
            userId,
            items,
            amount,
            addressId,
            paymentType: "Online",
        });

        // Initialize Stripe
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // Build line_items for Stripe Checkout
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
                userId: userId.toString(),
            },
        });

        return res.json({ 
            success: true, 
            url: session.url 
        });

    } catch (error) {
        console.error("Stripe order error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to create payment session. Please try again." 
        });
    }
};

/**
 * Stripe Webhooks to Verify Payments
 * Route: POST /stripe
 * Access: Public (Stripe webhook)
 */
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
        console.error("Webhook signature verification failed:", err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const paymentIntentId = paymentIntent.id;

                // Retrieve the session to get metadata (orderId & userId)
                const sessions = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntentId,
                });

                if (sessions.data.length > 0) {
                    const { orderId, userId } = sessions.data[0].metadata;

                    // Mark Order as paid
                    await Order.update(
                        { isPaid: true },
                        { where: { id: orderId } }
                    );

                    // Clear the user's cart
                    await User.update(
                        { cartItems: {} },
                        { where: { id: userId } }
                    );
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const paymentIntentId = paymentIntent.id;

                // Retrieve the session to get metadata
                const sessions = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntentId,
                });

                if (sessions.data.length > 0) {
                    const { orderId } = sessions.data[0].metadata;
                    
                    // Delete the failed order
                    await Order.destroy({
                        where: { id: orderId }
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }

        response.json({ received: true });

    } catch (error) {
        console.error("Webhook processing error:", error.message);
        response.status(500).json({ error: "Webhook processing failed" });
    }
};

/**
 * Update Order Status
 * Route: PUT /api/order/status/:orderId
 * Access: Admin/Seller
 */
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

        // Prepare update data
        const updateData = { status };
        
        // Add timestamp based on status
        if (status === 'Shipped') {
            updateData.shippedAt = new Date();
        } else if (status === 'Delivered') {
            updateData.deliveredAt = new Date();
        }

        // Find and update the order
        const [updatedRowsCount] = await Order.update(updateData, {
            where: { id: orderId }
        });

        if (updatedRowsCount === 0) {
            return res.json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        // Fetch updated order with user details
        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                }
            ]
        });

        // Here you could add email notification logic
        // await sendOrderStatusEmail(order.user.email, order, status);

        return res.json({ 
            success: true, 
            message: `Order status updated to ${status}`,
            order 
        });

    } catch (error) {
        console.error("Order status update error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to update order status. Please try again." 
        });
    }
};

/**
 * Get Orders by User ID
 * Route: GET /api/order/user
 * Access: Private (requires authentication)
 */
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.json({ 
                success: false, 
                message: "Not authorized" 
            });
        }

        // Fetch user orders with address details
        const orders = await Order.findAll({
            where: {
                userId,
                [Op.or]: [ // Fixed: Use Op.or instead of sequelize.Op.or
                    { paymentType: "COD" },
                    { isPaid: true }
                ]
            },
            include: [
                {
                    model: Address,
                    as: 'address'
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Process orders to include product details
        const processedOrders = await Promise.all(
            orders.map(async (order) => {
                const orderData = order.toJSON();
                
                // Fetch product details for each item
                const itemsWithProducts = await Promise.all(
                    orderData.items.map(async (item) => {
                        try {
                            const product = await Product.findByPk(item.product, {
                                attributes: ['id', 'name', 'category', 'image', 'offerPrice']
                            });
                            
                            return {
                                ...item,
                                product: product ? product.toJSON() : null
                            };
                        } catch (error) {
                            console.error(`Error fetching product ${item.product}:`, error);
                            return {
                                ...item,
                                product: null
                            };
                        }
                    })
                );

                // Filter out items with null products
                const validItems = itemsWithProducts.filter(item => item.product !== null);
                
                // Only return order if it has valid items
                if (validItems.length === 0) {
                    return null;
                }

                return {
                    ...orderData,
                    items: validItems
                };
            })
        );

        // Filter out null orders
        const filteredOrders = processedOrders.filter(order => order !== null);

        return res.json({ 
            success: true, 
            orders: filteredOrders 
        });

    } catch (error) {
        console.error("Error fetching user orders:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to fetch orders. Please try again." 
        });
    }
};

/**
 * Get All Orders (for seller/admin)
 * Route: GET /api/order/seller
 * Access: Admin/Seller
 */
export const getAllOrders = async (req, res) => {
    try {
        // Fetch all orders with address details
        const orders = await Order.findAll({
            where: {
                [Op.or]: [ // Fixed: Use Op.or instead of sequelize.Op.or
                    { paymentType: "COD" },
                    { isPaid: true }
                ]
            },
            include: [
                {
                    model: Address,
                    as: 'address'
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Process orders to include product details
        const processedOrders = await Promise.all(
            orders.map(async (order) => {
                const orderData = order.toJSON();
                
                // Fetch product details for each item
                const itemsWithProducts = await Promise.all(
                    orderData.items.map(async (item) => {
                        try {
                            const product = await Product.findByPk(item.product, {
                                attributes: ['id', 'name', 'category', 'image', 'offerPrice']
                            });
                            
                            return {
                                ...item,
                                product: product ? product.toJSON() : null
                            };
                        } catch (error) {
                            console.error(`Error fetching product ${item.product}:`, error);
                            return {
                                ...item,
                                product: null
                            };
                        }
                    })
                );

                // Filter out items with null products
                const validItems = itemsWithProducts.filter(item => item.product !== null);
                
                // Only return order if it has valid items
                if (validItems.length === 0) {
                    return null;
                }

                return {
                    ...orderData,
                    items: validItems
                };
            })
        );

        // Filter out null orders
        const filteredOrders = processedOrders.filter(order => order !== null);

        return res.json({ 
            success: true, 
            orders: filteredOrders 
        });

    } catch (error) {
        console.error("Error fetching all orders:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to fetch orders. Please try again." 
        });
    }
};