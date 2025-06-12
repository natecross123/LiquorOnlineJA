// routes/productRoute.js
import express from "express";
import { upload } from "../configs/multer.js";
import {
  addProduct,
  changeStock,
  ProductById,
  ProductList,
  removeProduct,
} from "../controllers/productController.js";
import authSeller from "../middlewares/authSeller.js";

const productRouter = express.Router();

productRouter.post("/add", upload.array("images"), authSeller, addProduct);
productRouter.get("/list", ProductList);
productRouter.get("/:id", ProductById);
productRouter.post("/stock", authSeller, changeStock);
productRouter.delete("/remove/:id", authSeller, removeProduct);

export default productRouter;

