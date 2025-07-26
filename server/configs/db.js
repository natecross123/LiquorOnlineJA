import { Sequelize } from 'sequelize';
import pg from 'pg';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg, 
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  pool: {
    max: 5,        // Reduced for serverless
    min: 0,        // No minimum connections for serverless
    acquire: 30000, 
    idle: 10000,
  },
  
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
    
    // Only sync in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    throw error; // Don't exit in serverless
  }
};

export { sequelize, connectDB };
export default connectDB;