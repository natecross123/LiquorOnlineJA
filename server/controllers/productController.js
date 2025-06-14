import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { Op } from 'sequelize';

/**
 * Add Product
 * Route: POST /api/product/add
 * Access: Private (Seller only)
 */
export const addProduct = async (req, res) => {
    try {
        let productData;
        
        // Parse product data
        try {
            productData = JSON.parse(req.body.productData);
        } catch (parseError) {
            return res.json({ 
                success: false, 
                message: "Invalid product data format" 
            });
        }

        // Handle price conversion and validation
        if (productData.price) {
            productData.price = parseFloat(productData.price);
            if (isNaN(productData.price) || productData.price < 0) {
                return res.json({ 
                    success: false, 
                    message: "Invalid price value" 
                });
            }
        }

        if (productData.offerPrice) {
            productData.offerPrice = parseFloat(productData.offerPrice);
            if (isNaN(productData.offerPrice) || productData.offerPrice < 0) {
                return res.json({ 
                    success: false, 
                    message: "Invalid offer price value" 
                });
            }
        }

        // Validate that offer price is not greater than regular price
        if (productData.price && productData.offerPrice && productData.offerPrice > productData.price) {
            return res.json({ 
                success: false, 
                message: "Offer price cannot be greater than regular price" 
            });
        }

        // Handle image uploads
        const images = req.files;
        if (!images || images.length === 0) {
            return res.json({ 
                success: false, 
                message: "At least one image is required" 
            });
        }

        let imagesURL = await Promise.all(
            images.map(async (item) => {
                try {
                    let result = await cloudinary.uploader.upload(item.path, {
                        resource_type: "image",
                        folder: "products", // Organize images in a folder
                        transformation: [
                            { width: 800, height: 800, crop: "limit" }, // Optimize image size
                            { quality: "auto" }
                        ]
                    });
                    return result.secure_url;
                } catch (uploadError) {
                    console.error("Image upload error:", uploadError);
                    throw new Error("Failed to upload image");
                }
            })
        );

        // Create product
        const product = await Product.create({
            ...productData,
            image: imagesURL
        });

        return res.json({ 
            success: true, 
            message: "Product added successfully",
            productId: product.id
        });

    } catch (error) {
        console.error("Add product error:", error.message);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => err.message);
            return res.json({ 
                success: false, 
                message: "Validation error: " + validationErrors.join(', ')
            });
        }

        return res.json({ 
            success: false, 
            message: "Failed to add product. Please try again." 
        });
    }
};

/**
 * Get All Products
 * Route: GET /api/product/list
 * Access: Public
 */
export const ProductList = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            inStock, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        // Build where clause
        const whereClause = {};
        
        if (category) {
            whereClause.category = category;
        }
        
        if (inStock !== undefined) {
            whereClause.inStock = inStock === 'true';
        }
        
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { category: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Calculate offset
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch products with pagination
        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset
        });

        return res.json({ 
            success: true, 
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalProducts: count,
                hasNextPage: offset + parseInt(limit) < count,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error("Product list error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to fetch products. Please try again." 
        });
    }
};

/**
 * Get Product by ID
 * Route: GET /api/product/:id
 * Access: Public
 */
export const ProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing product ID" 
            });
        }

        const product = await Product.findByPk(id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: "Product not found" 
            });
        }

        return res.json({ 
            success: true, 
            product 
        });

    } catch (error) {
        console.error("Product by ID error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to fetch product. Please try again." 
        });
    }
};

/**
 * Change Stock Status
 * Route: PUT /api/product/stock
 * Access: Private (Seller only)
 */
export const changeStock = async (req, res) => {
    try {
        const { id, inStock } = req.body;
        
        if (!id || inStock === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing id or inStock parameter" 
            });
        }

        // Update stock status
        const [updatedRowsCount] = await Product.update(
            { inStock: Boolean(inStock) },
            { where: { id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Product not found" 
            });
        }

        return res.json({ 
            success: true, 
            message: "Stock status updated successfully" 
        });

    } catch (error) {
        console.error("Change stock error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to update stock status. Please try again." 
        });
    }
};

/**
 * Remove Product
 * Route: DELETE /api/product/remove/:id
 * Access: Private (Seller only)
 */
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
        const product = await Product.findByPk(id);
        
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
                        const urlParts = imageUrl.split('/');
                        const fileNameWithExtension = urlParts[urlParts.length - 1];
                        const publicId = fileNameWithExtension.split('.')[0];
                        
                        // Include folder path if images are organized in folders
                        const folderPath = urlParts.slice(-2, -1)[0];
                        const fullPublicId = folderPath === 'products' ? 
                            `products/${publicId}` : publicId;
                        
                        await cloudinary.uploader.destroy(fullPublicId);
                    } catch (imageError) {
                        console.error("Error deleting image:", imageError.message);
                        // Continue with product deletion even if image deletion fails
                    }
                })
            );
        }

        // Delete the product from database
        await Product.destroy({
            where: { id }
        });

        return res.json({ 
            success: true, 
            message: "Product removed successfully" 
        });

    } catch (error) {
        console.error("Remove product error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to remove product. Please try again." 
        });
    }
};

/**
 * Get Products by Category
 * Route: GET /api/product/category/:category
 * Access: Public
 */
export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20, page = 1 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: products } = await Product.findAndCountAll({
            where: { 
                category: { [Op.iLike]: `%${category}%` },
                inStock: true 
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        return res.json({ 
            success: true, 
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalProducts: count
            }
        });

    } catch (error) {
        console.error("Products by category error:", error.message);
        return res.json({ 
            success: false, 
            message: "Failed to fetch products by category." 
        });
    }
};

