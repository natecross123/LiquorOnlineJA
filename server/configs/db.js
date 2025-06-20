import { Sequelize } from 'sequelize';

// Better connection pool settings for Neon PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  
  pool: {
    max: 50,        // Increased from 10 - better for concurrent requests
    min: 5,         // Keep some connections alive instead of 0
    acquire: 30000, 
    idle: 10000,    // idle time
  },
  
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
    
    // Sync all models
    await sequelize.sync({ alter: true }); // Use { force: true } only in development to recreate tables
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
export default connectDB;