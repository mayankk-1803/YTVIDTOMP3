import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import IORedis from 'ioredis';

dotenv.config();

const execPromise = util.promisify(exec);

// 📁 Download folder
const DOWNLOAD_DIR = path.resolve('./downloads');

// Ensure folder exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ☁️ Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔗 Redis
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {}
});

// 🗄 MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Worker connected to MongoDB'))
  .catch(console.error);

// Schema
const conversionSchema = new mongoose.Schema({
  status: String,
  fileUrl: String
}, { strict: false });

const Conversion = mongoose.model('Conversion', conversionSchema);

console.log('🚀 Worker started');

// 🧠 Worker
const worker = new Worker('conversionQueue', async job => {
  const { conversionId, url } = job.data;

  console.log(`🎯 Processing job ${job.id}`);

  try {
    await Conversion.findByIdAndUpdate(conversionId, { status: 'processing' });

    const outputTemplate = path.join(DOWNLOAD_DIR, `${conversionId}.%(ext)s`);

    // 🔥 FIXED COMMAND (NO WINDOWS PATHS)
    const command = `yt-dlp -f "ba" -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${url}"`;

    console.log("Running:", command);
    await execPromise(command);

    const finalFilePath = path.join(DOWNLOAD_DIR, `${conversionId}.mp3`);

    if (!fs.existsSync(finalFilePath)) {
      throw new Error("MP3 not found");
    }

    // Upload
    const uploadResult = await cloudinary.uploader.upload(finalFilePath, {
      resource_type: 'video',
      folder: 'audioflux',
    });

    fs.unlinkSync(finalFilePath);

    await Conversion.findByIdAndUpdate(conversionId, {
      status: 'completed',
      fileUrl: uploadResult.secure_url
    });

    console.log(`✅ Job ${job.id} done`);

  } catch (error) {
    console.error("❌ Job failed:", error);

    await Conversion.findByIdAndUpdate(conversionId, {
      status: 'failed'
    });

    throw error;
  }
}, {
  connection
});

// Events
worker.on('completed', job => {
  console.log(`🎉 Completed ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.log(`💥 Failed ${job.id}: ${err.message}`);
});