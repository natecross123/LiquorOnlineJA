
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

export const addProduct = async (req, res) => {
  try {
    let productData = JSON.parse(req.body.productData);

    const images = req.files; 
    let imagesURL = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    await Product.create({ ...productData, image: imagesURL });

    return res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const ProductList = async (req, res) => {
  try {
    const products = await Product.find({});
    return res.json({ success: true, products });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
export const ProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const changeStock = async (req, res) => {
  try {

    const { id, inStock } = req.body;
    if (!id || inStock === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing id or inStock" });
    }

    await Product.findByIdAndUpdate(id, { inStock });
    return res.json({ success: true, message: "Stock Updated" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
