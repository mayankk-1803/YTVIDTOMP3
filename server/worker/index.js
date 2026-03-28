import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import IORedis from 'ioredis';

// 🔥 IMPORT EXISTING MODEL (IMPORTANT FIX)
import Conversion from '../models/Conversion.js';

dotenv.config();
console.log("ENV CHECK:", process.env.CLOUDINARY_CLOUD_NAME);
const execPromise = util.promisify(exec);

// 🔒 Prevent multiple workers
let workerInstance = null;

export const startWorker = () => {
  if (workerInstance) {
    console.log("⚠️ Worker already running");
    return workerInstance;
  }

  console.log('🚀 Starting merged worker...');

  // 📁 Download folder
  const DOWNLOAD_DIR = path.resolve('./downloads');

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // ☁️ Cloudinary config
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // 🔗 Redis connection
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {}
  });

  // 🧠 Worker
  workerInstance = new Worker(
    'conversionQueue',
    async (job) => {
      const { conversionId, url } = job.data;

      console.log(`🎯 Processing job ${job.id}`);

      try {
        // 🔄 Update status → processing
        await Conversion.findByIdAndUpdate(conversionId, {
          status: 'processing'
        });

        const outputTemplate = path.join(
          DOWNLOAD_DIR,
          `${conversionId}.%(ext)s`
        );

        // 🎧 yt-dlp command
        const command = `yt-dlp -f "ba" -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${url}"`;

        console.log("⚙️ Running:", command);
        await execPromise(command);

        const finalFilePath = path.join(
          DOWNLOAD_DIR,
          `${conversionId}.mp3`
        );

        if (!fs.existsSync(finalFilePath)) {
          throw new Error("MP3 not found after conversion");
        }

        // ☁️ Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
          finalFilePath,
          {
            resource_type: 'video',
            folder: 'audioflux',
          }
        );

        // 🗑 Delete local file
        fs.unlinkSync(finalFilePath);

        // ✅ Update DB
        await Conversion.findByIdAndUpdate(conversionId, {
          status: 'completed',
          fileUrl: uploadResult.secure_url
        });

        console.log(`✅ Job ${job.id} completed`);

      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        await Conversion.findByIdAndUpdate(conversionId, {
          status: 'failed'
        });

        throw error;
      }
    },
    { connection }
  );

  // 📡 Events
  workerInstance.on('completed', (job) => {
    console.log(`🎉 Completed ${job.id}`);
  });

  workerInstance.on('failed', (job, err) => {
    console.log(`💥 Failed ${job?.id}: ${err.message}`);
  });

  return workerInstance;
};