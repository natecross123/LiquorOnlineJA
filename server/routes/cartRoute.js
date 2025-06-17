import express from "express";
import { updateCart, getCart } from "../controllers/cartController.js";
import authUser from "../middlewares/authUser.js";

const cartRouter = express.Router();

// Get user's cart data
cartRouter.get('/get', authUser, getCart);

// Update user's cart data
cartRouter.post('/update', authUser, updateCart);

export default cartRouter; 