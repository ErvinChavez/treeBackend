const multer = require('multer');

/**
 * Multer memory storage configuration
 * Stores uploaded files in memory for immediate image processing with Sharp
 */
const storage = multer.memoryStorage();

/**
 * File validation middleware
 * Restricts uploads to image MIME types only
 */
const fileFilter = (req, file, cb) => {
    if (!file || !file.mimetype) {
        return cb(new Error('No file provided'), false);
    }

    //allow image uploads only
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only image files allowed"), false);
    }

    cb(null, true);
};

/**
 * Upload middleware configuration
 * Includes:
 * - in-memory storage
 * - image validation
 * - file size protection
 */
const upload = multer({ 
    storage, 
    fileFilter,

    // Limit uploads to 5MB
    limits: {
        fileSize: 5 * 1024 * 1024
    } 
});

module.exports = upload;