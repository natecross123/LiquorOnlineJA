// routes/orderRoutes.js (create this file or update your existing order routes)

import express from 'express';
import { 
  placeOrderCOD, 
  placeOrderStripe, 
  getUserOrders, 
  getAllOrders,
  updateOrderStatus  
} from '../controllers/orderController.js';
import authUser from '../middlewares/authUser.js'; 
const orderRouter = express.Router();

// Existing routes
orderRouter.post('/cod', authUser, placeOrderCOD);
orderRouter.post('/stripe', authUser, placeOrderStripe);
orderRouter.get('/user', authUser, getUserOrders);
orderRouter.get('/seller', getAllOrders); 
orderRouter.put('/status/:orderId', updateOrderStatus);

export default orderRouter;