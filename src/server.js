// src/server.js (Fixed)
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
const testDbConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit if DB connection fails
  }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Project Management System API is running',
    version: '1.0.0' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.statusCode || 500).json({ 
    message: err.message || 'Something went wrong on the server',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server
const startServer = async () => {
  await testDbConnection();
  
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const handleShutdown = async (signal) => {
    console.log(`${signal} signal received: closing HTTP server`);
    server.close(async () => {
      console.log('HTTP server closed');
      await prisma.$disconnect();
      console.log('Prisma client disconnected');
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
  });
};

startServer();