const sharp = require('sharp');
const path = require('path');
const JobPhoto = require('../models/JobPhoto');
const Job = require('../models/Job');

exports.uploadPhoto = async (req, res) => {
    try {
      const { jobId, type } = req.body;
      
      //validate file exists
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      //validate job exists
      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(400).json({ error: 'Job not found' });
      }
      //validate type (before/after only)
      const validTypes = ['before', 'after'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid photo type' });
      }

      //generate unique filename
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const filepath = path.join(__dirname, '../uploads/', uniqueName);

      //resize and covert to Webp with Sharp
      await sharp(req.file.buffer)
        .resize({width: 1200}) //max width 1200px
        .webp({ quality: 80 })
        .toFile(filepath);

      //save to db
      const photo = await JobPhoto.create({
        jobId,
        url: uniqueName,
        type: type || 'before'
      });
      res.json(photo);
    } catch (err) {
        console.error(error);
        res.status(500).json({ error: ' Something went wrong with the upload.' });
    }
};