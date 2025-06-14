import { DataTypes } from 'sequelize';
import { sequelize } from '../configs/db.js';

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.UUID, 
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id'
        }
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
            isValidItems(value) {
                if (!Array.isArray(value) || value.length === 0) {
                    throw new Error('Items must be a non-empty array');
                }
                
                for (const item of value) {
                    if (!item.product || !item.quantity || item.quantity <= 0) {
                        throw new Error('Each item must have a valid product ID and quantity > 0');
                    }
                }
            }
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    addressId: {
        type: DataTypes.UUID, // Changed from INTEGER to UUID
        allowNull: false,
        references: {
            model: 'addresses', // Changed from 'Addresses' to 'addresses' (lowercase)
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('Order Placed', 'Shipped', 'Delivered', 'Cancelled'),
        defaultValue: 'Order Placed',
        allowNull: false
    },
    paymentType: {
        type: DataTypes.ENUM('COD', 'Online'),
        allowNull: false
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    shippedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'orders', // Changed from 'Orders' to 'orders' for consistency
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['paymentType']
        },
        {
            fields: ['isPaid']
        },
        {
            fields: ['createdAt']
        }
    ]
});

// Define associations
Order.associate = (models) => {
    // Order belongs to User
    Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
    
    // Order belongs to Address
    Order.belongsTo(models.Address, {
        foreignKey: 'addressId',
        as: 'address'
    });
};

export default Order;