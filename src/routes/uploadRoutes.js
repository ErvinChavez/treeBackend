const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const { uploadPhoto } = require('../controllers/uploadController');

//POST /api/upload (admin only)
router.post('/', protect, upload.single("file"), uploadPhoto);

module.exports = router;