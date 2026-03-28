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

// 🔥 PATHS (VERY IMPORTANT)
const ytDlpPath = "C:\\yt-dlp\\yt-dlp.exe";
const ffmpegPath = "C:\\ffmpeg\\ffmpeg-8.1-essentials_build\\bin";

// 📁 Download folder
const DOWNLOAD_DIR = path.resolve('../downloads');

// Ensure folder exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ☁️ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔗 Redis Config (Upstash compatible)
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {}
});

// 🗄 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Worker connected to MongoDB'))
  .catch(console.error);

// Schema
const conversionSchema = new mongoose.Schema({
  status: String,
  fileUrl: String,
  metadata: {
    title: String,
    duration: Number,
  }
}, { strict: false });

const Conversion = mongoose.model('Conversion', conversionSchema);

console.log('🚀 Starting conversion worker...');

// 🧠 Worker Logic
const worker = new Worker('conversionQueue', async job => {
  const { conversionId, url } = job.data;

  console.log(`🎯 Processing job ${job.id} for conversion ${conversionId}`);

  try {
    // 1️⃣ Update status
    await Conversion.findByIdAndUpdate(conversionId, { status: 'processing' });

    // 2️⃣ Output template
    const outputTemplate = path.join(DOWNLOAD_DIR, `${conversionId}.%(ext)s`);

    // 3️⃣ yt-dlp command (FULLY FIXED)
    const command = `"${ytDlpPath}" -f "ba" -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpegPath}" -o "${outputTemplate}" "${url}"`;

    console.log(`⚙️ Executing: ${command}`);
    await execPromise(command);

    // 4️⃣ Final MP3 file path
    const finalFilePath = path.join(DOWNLOAD_DIR, `${conversionId}.mp3`);

    if (!fs.existsSync(finalFilePath)) {
      throw new Error("❌ MP3 file not found after conversion");
    }

    // 5️⃣ Upload to Cloudinary
    console.log(`☁️ Uploading ${finalFilePath} to Cloudinary...`);

    const uploadResult = await cloudinary.uploader.upload(finalFilePath, {
      resource_type: 'video', // needed for audio
      folder: 'audioflux',
    });

    // 6️⃣ Delete local file
    try {
      fs.unlinkSync(finalFilePath);
      console.log("🗑️ Local file deleted");
    } catch (err) {
      console.warn("⚠️ File delete failed:", err);
    }

    // 7️⃣ Update DB
    await Conversion.findByIdAndUpdate(conversionId, {
      status: 'completed',
      fileUrl: uploadResult.secure_url
    });

    console.log(`✅ Job ${job.id} completed successfully`);

  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error);

    await Conversion.findByIdAndUpdate(conversionId, {
      status: 'failed'
    });

    throw error;
  }
}, {
  connection
});

// 📡 Events
worker.on('completed', job => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.log(`💥 Job ${job.id} failed with ${err.message}`);
});