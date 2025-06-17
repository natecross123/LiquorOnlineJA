import express from "express";
import { upload } from "../configs/multer.js";
import {
    addProduct,
    changeStock,
    ProductById,
    ProductList,
    removeProduct,
    getProductsByCategory
} from "../controllers/productController.js";
import authSeller from "../middlewares/authSeller.js";

const productRouter = express.Router();

// Add new product (with image upload)
productRouter.post("/add", upload.array("images", 5), authSeller, addProduct);

// Get all products (with optional filtering and pagination)
productRouter.get("/list", ProductList);

// Get single product by ID - Fixed route to match frontend navigation
productRouter.get("/:id", ProductById);

// Get products by category
productRouter.get("/category/:category", getProductsByCategory);

// Update stock status
productRouter.put("/stock", authSeller, changeStock);

// Remove product
productRouter.delete("/remove/:id", authSeller, removeProduct);

export default productRouter; 