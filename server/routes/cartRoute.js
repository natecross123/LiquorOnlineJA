import express from "express";
import { updateCart } from "../controllers/cartController.js";
import authUser from "../middlewares/authUser.js";

const cartRouter = express.Router();

// Update user's cart data
cartRouter.post('/update', authUser, updateCart);

export default cartRouter;