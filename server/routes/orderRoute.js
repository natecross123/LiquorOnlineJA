import express from 'express';
import { 
    placeOrderCOD, 
    placeOrderStripe, 
    getUserOrders, 
    getAllOrders,
    updateOrderStatus,
    stripeWebhooks
} from '../controllers/orderController.js';
import authUser from '../middlewares/authUser.js';

const orderRouter = express.Router();

// Place order with Cash on Delivery
orderRouter.post('/cod', authUser, placeOrderCOD);

// Place order with Stripe payment
orderRouter.post('/stripe', authUser, placeOrderStripe);

// Get user's orders
orderRouter.get('/user', authUser, getUserOrders);

// Get all orders (for seller/admin)
orderRouter.get('/seller', getAllOrders);

// Update order status
orderRouter.put('/status/:orderId', updateOrderStatus);

export default orderRouter;