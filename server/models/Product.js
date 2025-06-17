import { DataTypes } from 'sequelize';
import { sequelize } from '../configs/db.js';

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Product name is required'
            },
            len: {
                args: [1, 255],
                msg: 'Product name must be between 1 and 255 characters'
            }
        }
    },
    description: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
            isValidDescription(value) {
                if (!Array.isArray(value) || value.length === 0) {
                    throw new Error('Description must be a non-empty array');
                }
            }
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: {
                args: [0],
                msg: 'Price must be a positive number'
            }
        }
    },
    offerPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: {
                args: [0],
                msg: 'Offer price must be a positive number'
            },
            isValidOfferPrice(value) {
                if (value && this.price && parseFloat(value) > parseFloat(this.price)) {
                    throw new Error('Offer price cannot be greater than regular price');
                }
            }
        }
    },
    image: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
            isValidImages(value) {
                if (!Array.isArray(value) || value.length === 0) {
                    throw new Error('At least one image is required');
                }
                
                // Validate each image URL
                for (const imageUrl of value) {
                    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
                        throw new Error('All image URLs must be valid strings');
                    }
                }
            }
        }
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Category is required'
            },
            len: {
                args: [1, 100],
                msg: 'Category must be between 1 and 100 characters'
            }
        }
    },
    inStock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'Products',
    timestamps: true, // This creates createdAt and updatedAt
    indexes: [
        {
            fields: ['category']
        },
        {
            fields: ['inStock']
        },
        {  
            fields: ['name']
        },
        {
            fields: ['price']
        },
        {
            fields: ['offerPrice']
        },
        {
            fields: ['createdAt']
        }
    ],
    hooks: {
        // Hook to validate offer price against price before save
        beforeValidate: (product, options) => {
            if (product.price && product.offerPrice) {
                const price = parseFloat(product.price);
                const offerPrice = parseFloat(product.offerPrice);
                
                if (offerPrice > price) {
                    throw new Error('Offer price cannot be greater than regular price');
                }
            }
        }
    }
});

// Define associations
Product.associate = (models) => {
    // Products might be referenced in Orders through the items JSON field
    // No direct associations needed since orders store product references in JSON
    // This preserves order history even if products are deleted
};

export default Product;

