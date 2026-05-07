//import sharp, image processing software for Node
const sharp = require('sharp');
//import for database operations
const JobPhoto = require('../models/JobPhoto');
const Job = require('../models/Job');
//import reusable Supabase connection
const supabase = require("../supabase");

//export the function so routes can use it
exports.uploadPhoto = async (req, res) => {
  try {
    //pull form fields from request body
    const { jobId, type } = req.body;
      
    //validate if multer received a file
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    //validate job exists by primary key
    const job = await Job.findByPk(jobId);
    //prevents uploaded images tied to nonexistent jobs
    if (!job) {
      return res.status(400).json({ error: 'Job not found' });
    }

    //validate type (before/after only)
    const validTypes = ['before', 'after'];
      //prevents frontend to sending random uploads
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid photo type' });
      }

    //takes uploaded file buffer from memory
    const buffer = await sharp(req.file.buffer)
      //limit image width
      .resize({width: 1200})
      //convert WebP
      .webp({ quality: 80 })
      //return processed image as memory buffer
      .toBuffer();

    //generate uniqueName for file
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  
    //access Supabase Storage API
    const { error } = await supabase.storage
      //bucket name
      .from("job-photos")
      //upload processed image
      .upload(uniqueName, buffer, {
        //tells browser/file systems, this is a WebP image
        contentType: "image/webp",
        //do not overwrite existing file
        upsert: false,
      })
      //check Supabase upload failure
      if (error){
        console.error("SUPABASE ERROR:", error);
        //moves failure to main catch block
        throw error;}

    //get accessible URL for uploaded image
    const { data } = supabase.storage
      .from("job-photos")
      .getPublicUrl(uniqueName);
      
      //extract clean readable variable
      const publicUrl = data.publicUrl;

      //store image reference in PostgreSQL
      const photo = await JobPhoto.create({
        jobId,
        url: publicUrl,
        //fallback value if frontend sends nothing
        type: type || 'before'
      });
  
  //returns uploaded image URL to frontend to display
  res.json({ url: publicUrl });
  
  //catch sharp, DB, Supabase, and unexpected runtime failures
  } catch (err) {
    //backend logs error
    console.error(err)
    //return error to frontend
    res.status(500).json({ error: "Something went wrong uploading the photo"});
  }
};