import { DataTypes } from 'sequelize';
import { sequelize } from '../configs/db.js';
import User from './User.js';
<<<<<<< Updated upstream
import Address from './Address.js';
=======
>>>>>>> Stashed changes

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
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Address,
            key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
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
<<<<<<< Updated upstream
    tableName: 'orders',
=======
    tableName: 'orders', 
>>>>>>> Stashed changes
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

// Define associations directly
Order.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

Order.belongsTo(Address, {
    foreignKey: 'addressId',
    as: 'address'
});

// Define reverse associations
User.hasMany(Order, {
    foreignKey: 'userId',
    as: 'orders'
});

Address.hasMany(Order, {
    foreignKey: 'addressId',
    as: 'orders'
});

export default Order;

