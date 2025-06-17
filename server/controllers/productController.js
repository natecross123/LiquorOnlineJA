import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { Op } from 'sequelize';

const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

export const addProduct = async (req, res) => {
  try {
    console.log('Raw request body:', req.body);
    console.log('Files received:', req.files?.length);
    
    const productData = JSON.parse(req.body.productData);
    console.log('Parsed product data:', productData);
    
    const images = req.files;

    if (!images?.length) {
      return res.json({ success: false, message: "Images required" });
    }

    // Improved price validation
    const validatePrice = (priceValue, fieldName) => {
      // Handle empty string, null, undefined
      if (priceValue === null || priceValue === undefined || priceValue === '' || priceValue === 'null') {
        return null;
      }
      
      const numPrice = parseFloat(priceValue);
      
      // Check if it's a valid number and positive
      if (isNaN(numPrice) || numPrice < 0) {
        throw new Error(`Invalid ${fieldName}: must be a positive number or empty`);
      }
      
      return numPrice;
    };

    let price = null;
    let offerPrice = null;

    try {
      price = validatePrice(productData.price, 'price');
      offerPrice = validatePrice(productData.offerPrice, 'offer price');
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }

    console.log('Validated prices - price:', price, 'offerPrice:', offerPrice);

    // At least one price must be provided
    if (price === null && offerPrice === null) {
      return res.json({ success: false, message: "At least one price (regular or offer) is required" });
    }

    // If both prices exist, offer price must be less than regular price
    if (price !== null && offerPrice !== null && offerPrice >= price) {
      return res.json({ success: false, message: "Offer price must be less than regular price" });
    }

    const imagesURL = await Promise.all(
      images.map(item => cloudinary.uploader.upload(item.path, {
        folder: "products",
        transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }]
      }).then(result => result.secure_url))
    );

    const productToCreate = {
      name: productData.name,
      description: productData.description || '',
      category: productData.category,
      subCategory: productData.subCategory || '',
      price: price, // Will be null if not provided
      offerPrice: offerPrice, // Will be null if not provided
      bestseller: productData.bestseller || false,
      inStock: productData.inStock !== false,
      image: imagesURL
    };

    console.log('Creating product with data:', productToCreate);

    const product = await Product.create(productToCreate);

    cache.clear();

    return res.json({ 
      success: true, 
      message: "Product added successfully", 
      productId: product.id 
    });
  } catch (error) {
    console.error("Add product error:", error);
    return res.json({ success: false, message: "Failed to add product: " + error.message });
  }
};

export const ProductList = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, inStock, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const cacheKey = `products:${pageNum}:${limitNum}:${category || ''}:${inStock || ''}:${search || ''}:${sortBy}:${sortOrder}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }

    const whereClause = {};
    if (category) whereClause.category = { [Op.iLike]: `%${category}%` };
    if (inStock !== undefined) whereClause.inStock = inStock === 'true';
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    // Ensure all required fields are present and handle null prices properly
    const processedProducts = products.map(p => {
      const productData = p.toJSON();
      return {
        id: productData.id,
        _id: productData.id, // For frontend compatibility
        name: productData.name || '',
        description: productData.description || '',
        category: productData.category || '',
        subCategory: productData.subCategory || '',
        price: productData.price, // Keep as null if null
        offerPrice: productData.offerPrice, // Keep as null if null
        bestseller: productData.bestseller || false,
        inStock: productData.inStock !== false,
        image: productData.image || [],
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt
      };
    });

    const responseData = { 
      success: true, 
      products: processedProducts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalProducts: count,
        hasNextPage: (pageNum - 1) * limitNum + limitNum < count,
        hasPrevPage: pageNum > 1
      }
    };

    cache.set(cacheKey, { data: responseData, expires: Date.now() + CACHE_TTL });
    return res.json(responseData);
  } catch (error) {
    console.error("Product list error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

export const ProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const cacheKey = `product:${id}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }

    const product = await Product.findByPk(parseInt(id));
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productData = product.toJSON();
    const responseData = { 
      success: true, 
      product: {
        ...productData,
        _id: productData.id // Ensure _id field exists for frontend
      }
    };

    cache.set(cacheKey, { data: responseData, expires: Date.now() + CACHE_TTL });
    return res.json(responseData);
  } catch (error) {
    console.error("Product by ID error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    
    console.log('Change stock request:', { id, inStock });
    
    if (!id || inStock === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing id or inStock parameter" 
      });
    }

    const [updatedRowsCount] = await Product.update(
      { inStock: Boolean(inStock) },
      { where: { id: parseInt(id) } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Clear relevant cache
    cache.delete(`product:${id}`);
    for (const key of cache.keys()) {
      if (key.startsWith('products:')) cache.delete(key);
    }

    return res.json({ 
      success: true, 
      message: "Stock status updated successfully" 
    });
  } catch (error) {
    console.error("Change stock error:", error);
    return res.status(500).json({ success: false, message: "Failed to update stock status" });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, { attributes: ['id', 'image'] });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete from database first
    await Product.destroy({ where: { id } });

    // Delete images in background
    if (product.image?.length) {
      setImmediate(() => {
        product.image.forEach(async (imageUrl) => {
          try {
            const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Image deletion error:", err);
          }
        });
      });
    }

    cache.clear();
    return res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.error("Remove product error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove product" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const cacheKey = `category:${category}:${page}:${limit}`;
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const { count, rows: products } = await Product.findAndCountAll({
      where: { 
        category: { [Op.iLike]: `%${category}%` },
        inStock: true 
      },
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    const responseData = { 
      success: true, 
      products: products.map(p => ({ ...p.toJSON(), _id: p.id })),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalProducts: count
      }
    };

    cache.set(cacheKey, { data: responseData, expires: Date.now() + CACHE_TTL });
    return res.json(responseData);
  } catch (error) {
    console.error("Products by category error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};