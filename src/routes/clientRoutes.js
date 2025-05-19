// src/routes/clientRoutes.js
import express from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All these routes are admin-only
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/')
  .post(createClient) // Admin creates a new user with CLIENT role
  .get(getAllClients);

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

export default router;