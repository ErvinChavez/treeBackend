const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect routes (REST)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach admin user to request
      const admin = await Admin.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

      if (!admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

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

// Optional helper for GraphQL context
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