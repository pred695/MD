// src/controllers/clientController.js
import prisma from '../config/db.js';
import { hashPassword } from '../utils/authUtils.js';

// @desc    Admin creates a new client user
// @route   POST /api/clients
// @access  Private (Admin only)
export const createClient = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password for the client' });
  }

  try {
    const clientExists = await prisma.user.findUnique({ where: { email } });
    if (clientExists) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const client = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CLIENT', // Explicitly set role to CLIENT
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true } // Exclude password
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Server error creating client' });
  }
};


// @desc    Get all clients
// @route   GET /api/clients
// @access  Private (Admin only)
export const getAllClients = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true, _count: { select: { projects: true }} },
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching clients' });
  }
};

// @desc    Get a single client by ID
// @route   GET /api/clients/:id
// @access  Private (Admin only)
export const getClientById = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await prisma.user.findFirst({
      where: { id: parseInt(id), role: 'CLIENT' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true, projects: true },
    });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching client' });
  }
};

// @desc    Update a client's details
// @route   PUT /api/clients/:id
// @access  Private (Admin only)
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body; // Password updates should be handled separately or with more care

  try {
    const client = await prisma.user.findFirst({
      where: { id: parseInt(id), role: 'CLIENT' },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if email is being updated and if it's already taken by another user
    if (email && email !== client.email) {
        const emailExists = await prisma.user.findUnique({ where: { email }});
        if (emailExists && emailExists.id !== parseInt(id)) {
            return res.status(400).json({ message: 'Email already in use by another user' });
        }
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    // Add more fields to update as needed, e.g., password (would require hashing)

    if (Object.keys(updatedData).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedClient = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updatedData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    res.json(updatedClient);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') { // Prisma error code for record not found during update
        return res.status(404).json({ message: 'Client not found for update' });
    }
    res.status(500).json({ message: 'Server error updating client' });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private (Admin only)
export const deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await prisma.user.findFirst({
      where: { id: parseInt(id), role: 'CLIENT' },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Optional: Check if client has active projects before deleting or handle cascading deletes in Prisma schema
    const projectsCount = await prisma.project.count({ where: { clientId: parseInt(id) }});
    if (projectsCount > 0) {
        // Decide policy: prevent deletion, or delete/reassign projects
        // For now, prevent deletion if projects exist
        return res.status(400).json({ message: `Client has ${projectsCount} project(s). Please reassign or delete them first.` });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Client removed successfully' });
  } catch (error) {
    console.error(error);
     if (error.code === 'P2025') { // Prisma error code for record not found during delete
        return res.status(404).json({ message: 'Client not found for deletion' });
    }
    res.status(500).json({ message: 'Server error deleting client' });
  }
};