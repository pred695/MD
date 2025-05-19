// src/routes/projectRoutes.js
import express from 'express';
import {
  createProject,
  getAllProjectsAdmin,
  getProjectById,
  updateProject,
  deleteProject,
  getMyAssignedProjects,
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Client specific route
router.get('/mine', protect, authorize('CLIENT'), getMyAssignedProjects);

// Admin specific routes for project management
router.post('/', protect, authorize('ADMIN'), createProject);
router.get('/all', protect, authorize('ADMIN'), getAllProjectsAdmin); // Admin gets all projects

// Routes accessible by Admin for any project, and by Client for their assigned project
router.get('/:id', protect, getProjectById); // Logic inside controller checks client's access

// Admin only for update and delete
router.put('/:id', protect, authorize('ADMIN'), updateProject);
router.delete('/:id', protect, authorize('ADMIN'), deleteProject);


export default router;