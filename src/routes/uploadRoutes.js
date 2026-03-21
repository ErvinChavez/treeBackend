const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadPhoto } = require('../controllers/uploadController');

//POST /api/upload
router.post('/', upload.single('photo'), uploadPhoto);

module.exports = router;