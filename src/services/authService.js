const jwt = require('jsonwebtoken');

/**
 * Generates JWT token for authenticated admin users
 * Encodes minimal identity data required for authorization
 */
const generateToken = (admin) => {
    return jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d'}
    );
};

module.exports = { generateToken };