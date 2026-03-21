const multer = require('multer');

//multer memory storage (process images in memeory with Sharp)
const storage = multer.memoryStorage();

//file filter: only images allowed
const fileFilter = (req, file, cb) => {
    if (!file || !file.mimetype) {
        return cb(new Error('No file provided'), false);
    }
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;

