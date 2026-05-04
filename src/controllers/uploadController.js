const sharp = require('sharp');
const path = require('path');
const JobPhoto = require('../models/JobPhoto');
const Job = require('../models/Job');
const { url } = require('inspector');
const supabase = require("../supabase");

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

    //resize and covert to Webp with Sharp
    const buffer = await sharp(req.file.buffer)
      .resize({width: 1200}) //max width 1200px
      .webp({ quality: 80 })
      .toBuffer();

    //generate uniqueName
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      
    //upload to Supabase
    const { error } = await supabase.storage
      .from("job-photos") //bucket name
      .upload(uniqueName, buffer, {
        contentType: "image/webp",
        upsert: false,
      })

    if (error) throw error;

    // get public URL
    const { data } = supabase.storage
      .from("job-photos")
      .getPublicUrl(uniqueName);

    const publicUrl = data.publicUrl;

    //save to db
    const photo = await JobPhoto.create({
      jobId,
      url: publicUrl,
      type: type || 'before'
    });

    res.json({ url: publicUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};