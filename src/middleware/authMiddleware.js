const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * REST authentication middleware
 * Validates JWT tokens and attaches authenticated admin to request
 */
const protect = async (req, res, next) => {
  let token;

  //extract Bearer token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

       //verify and decode JWT payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      //fetch authenticated admin (exclude password for security)
      const admin = await Admin.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

      if (!admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

      //attach authenticated admin to request object
      req.admin = admin;
      next();

    } catch (error) {
      console.error(error);

      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * GraphQL authentication helper
 * Resolves authenticated admin from JWT token inside GraphQL context
 */
const getAdminFromToken = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findByPk(decoded.id);
    return admin || null;

  } catch (err) {
    return null;
  }
};

module.exports = { protect, getAdminFromToken };