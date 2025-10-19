import { DataTypes } from 'sequelize';
import { sequelize } from '../configs/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  }, 
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  cartItems: {
    type: DataTypes.JSONB, // JSONB is PostgreSQL's efficient JSON type
    defaultValue: {},
  },
}, {
  tableName: 'users',
  timestamps: true, 
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },  
  ],
});
export default User;

  
