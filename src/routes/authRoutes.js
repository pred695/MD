// src/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin creates user credentials (can be admin or client)
router.post('/register', protect, authorize('ADMIN'), registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

export default router;