const sharp = require('sharp');
const path = require('path');
const JobPhoto = require('../models/JobPhoto');

exports.uploadPhoto = async (req, res) => {
    try {
      const { jobId, type } = req.body;

      if (!req.file) return res.status(400).json({ error: 'No file provided' });

      //generate unique filename
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const filepath = path.join(__dirname, '../uploads/', uniqueName);

      //resize and covert to Webp
      await sharp(req.file.buffer)
        .resize({width: 1200}) //max width 1200px
        .webp({ quality: 80 })
        .toFile(filepath);

      //save to db
      const photo = await JobPhoto.create({
        jobId,
        url: `/uploads/${uniqueName}`,
        type: type || 'before'
      });
      res.json(photo);
    } catch (err) {
        console.error(error);
        res.status(500).json({ error: ' Something went wrong with the upload.' });
    }
};