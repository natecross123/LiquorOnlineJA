// controllers/productController.js
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

// Add product : POST /api/product/add
export const addProduct = async (req, res) => {
  try {
    let productData = JSON.parse(req.body.productData);

    // Handle price conversion and validation
    if (productData.price) {
      productData.price = parseFloat(productData.price);
      // Validate that price is a positive number
      if (isNaN(productData.price) || productData.price < 0) {
        return res.json({ success: false, message: "Invalid price value" });
      }
    }

    if (productData.offerPrice) {
      productData.offerPrice = parseFloat(productData.offerPrice);
      // Validate that offerPrice is a positive number
      if (isNaN(productData.offerPrice) || productData.offerPrice < 0) {
        return res.json({ success: false, message: "Invalid offer price value" });
      }
    }

    // Validate that offer price is not greater than regular price (if both exist)
    if (productData.price && productData.offerPrice && productData.offerPrice > productData.price) {
      return res.json({ success: false, message: "Offer price cannot be greater than regular price" });
    }

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

//change stock : PUT /api/product/change-stock
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

// Remove product : DELETE /api/product/remove/:id
export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required" 
      });
    }

    // Find the product first to get image URLs
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Delete images from Cloudinary
    if (product.image && product.image.length > 0) {
      await Promise.all(
        product.image.map(async (imageUrl) => {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (imageError) {
            console.log("Error deleting image:", imageError.message);
          }
        })
      );
    }

    // Delete the product from database
    await Product.findByIdAndDelete(id);

    return res.json({ 
      success: true, 
      message: "Product removed successfully" 
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};