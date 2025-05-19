// src/middleware/authMiddleware.js (Fixed)
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database, excluding password
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true },
      });

      // Check if user exists
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      } else {
        return res.status(401).json({ message: 'Authentication failed' });
      }
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const authorize = (roles = []) => {
  // Convert single role to array if string
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Ensure user exists on request
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized, authentication required' });
    }
    
    // Check if user's role is authorized
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: ${req.user.role} role does not have access to this resource` 
      });
    }
    
    // User is authorized
    next();
  };
};