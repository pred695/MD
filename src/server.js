// src/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './config/db.js'; // Ensure Prisma client is imported to establish connection (optional here if not used directly)

// Import routes
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js'; // Skipped as per request

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes); // Admin managing client users
app.use('/api/projects', projectRoutes);
// app.use('/api/payments', paymentRoutes); // Skipped

// Basic route
app.get('/', (req, res) => {
  res.send('Project Management System API is running...');
});

// Global error handler (very basic)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
    process.exit(0);
  });
});