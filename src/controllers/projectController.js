// src/controllers/projectController.js
import prisma from '../config/db.js';

// @desc    Admin creates a new project
// @route   POST /api/projects
// @access  Private (Admin only)
export const createProject = async (req, res) => {
  const { name, description, status, startDate, endDate, clientId } = req.body;

  if (!name || !clientId) {
    return res.status(400).json({ message: 'Project name and clientId are required' });
  }

  try {
    const clientExists = await prisma.user.findFirst({
        where: { id: parseInt(clientId), role: 'CLIENT' }
    });
    if (!clientExists) {
        return res.status(404).json({ message: 'Client not found or user is not a client' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status ? status.toUpperCase() : 'PENDING',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        clientId: parseInt(clientId),
      },
      include: { client: { select: { id: true, name: true, email: true } } } // Include client details
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

// @desc    Admin gets all projects
// @route   GET /api/projects/all
// @access  Private (Admin only)
export const getAllProjectsAdmin = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { client: { select: { id: true, name: true, email: true } } }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching all projects' });
  }
};

// @desc    Admin or assigned Client gets a project by ID
// @route   GET /api/projects/:id
// @access  Private (Admin or assigned Client)
export const getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: { client: { select: { id: true, name: true, email: true } } }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If user is a client, check if they are assigned to this project
    if (req.user.role === 'CLIENT' && project.clientId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You are not assigned to this project' });
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// @desc    Admin updates a project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status, startDate, endDate, clientId } = req.body;

  try {
    const projectExists = await prisma.project.findUnique({ where: { id: parseInt(id) }});
    if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
    }

    if (clientId) {
        const clientExists = await prisma.user.findFirst({
            where: { id: parseInt(clientId), role: 'CLIENT' }
        });
        if (!clientExists) {
            return res.status(404).json({ message: 'Client not found or user is not a client' });
        }
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (description !== undefined) updatedData.description = description; // Allow empty string
    if (status) updatedData.status = status.toUpperCase();
    if (startDate) updatedData.startDate = new Date(startDate);
    if (endDate) updatedData.endDate = new Date(endDate);
    if (clientId) updatedData.clientId = parseInt(clientId);


    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: updatedData,
      include: { client: { select: { id: true, name: true, email: true } } }
    });
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Project not found for update' });
    }
    res.status(500).json({ message: 'Server error updating project' });
  }
};

// @desc    Admin deletes a project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
export const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.project.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Project removed successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') { // Prisma error code for record not found during delete
        return res.status(404).json({ message: 'Project not found for deletion' });
    }
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

// @desc    Client views their assigned projects
// @route   GET /api/projects/mine
// @access  Private (Client only)
export const getMyAssignedProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { clientId: req.user.id }, // req.user.id comes from 'protect' middleware
      include: { client: { select: { id: true, name: true, email: true } } }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching assigned projects' });
  }
};