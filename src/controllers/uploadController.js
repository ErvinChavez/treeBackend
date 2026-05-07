//import sharp, image processing software for Node
const sharp = require('sharp');

//database models
const JobPhoto = require('../models/JobPhoto');
const Job = require('../models/Job');

//reusable Supabase connection
const supabase = require("../supabase");

/**
 * Uploads and processes job photos
 * Flow:
 * 1. Validate input
 * 2. Process image (resize + convert)
 * 3. Upload to Supabase Storage
 * 4. Save reference in PostgreSQL
 */

exports.uploadPhoto = async (req, res) => {
  try {
    const { jobId, type } = req.body;
      
    //validate if multer received a file
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    //validate job exists by primary key
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(400).json({ error: 'Job not found' });
    }

    //validate type (before/after only)
    const validTypes = ['before', 'after'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid photo type' });
    }

    //optimize image, resize and covert to WebP
    const buffer = await sharp(req.file.buffer)
      .resize({width: 1200})
      .webp({ quality: 80 })
      .toBuffer();

    //generate uniqueName to avoid same name overrides
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  
    //upload optimized image to Supabase storage bucket
    const { error } = await supabase.storage
      .from("job-photos")
      .upload(uniqueName, buffer, {
        contentType: "image/webp",
        upsert: false,
      });
      
      if (error){
        console.error("SUPABASE ERROR:", error);
        throw error;}

    //get accessible URL for uploaded image
    const { data } = supabase.storage
      .from("job-photos")
      .getPublicUrl(uniqueName);
      
    const publicUrl = data.publicUrl;

    //store image reference in PostgreSQL
    const photo = await JobPhoto.create({
      jobId,
      url: publicUrl,
      type: type || 'before'
    });
  

    return res.json({ url: publicUrl });
  
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Something went wrong uploading the photo"});
  }
};