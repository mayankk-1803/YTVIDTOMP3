import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// 🔥 IMPORT WORKER
import { startWorker } from './worker/index.js';

import Conversion from './models/Conversion.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI;
const REDIS_URL = process.env.REDIS_URL;

// 🔗 Redis (Upstash compatible)
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {}
});

// 📦 Queue
export const conversionQueue = new Queue('conversionQueue', {
  connection
});

app.use(cors());
app.use(express.json());

/* =========================
   🟢 HEALTH CHECK
========================= */
app.get('/', (req, res) => {
  res.send('🚀 AudioFlux API is running');
});

/* =========================
   🎯 CONVERT ROUTE
========================= */
app.post('/api/convert', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const conversion = new Conversion({
      url,
      status: 'pending'
    });

    await conversion.save();

    await conversionQueue.add('convert-mp3', {
      conversionId: conversion._id,
      url
    });

    res.status(202).json({
      message: 'Conversion started',
      jobId: conversion._id
    });

  } catch (error) {
    console.error('❌ Convert error:', error);
    res.status(500).json({ error: 'Failed to start conversion' });
  }
});

/* =========================
   📥 DOWNLOAD
========================= */
app.get('/api/download/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findById(req.params.id);

    if (!conversion || conversion.status !== 'completed' || !conversion.fileUrl) {
      return res.status(404).json({ error: 'File not ready' });
    }

    res.redirect(conversion.fileUrl);

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: 'Download error' });
  }
});

/* =========================
   📊 STATUS
========================= */
app.get('/api/status/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findById(req.params.id);

    if (!conversion) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(conversion);

  } catch (error) {
    console.error('❌ Status error:', error);
    res.status(500).json({ error: 'Status error' });
  }
});

/* =========================
   📜 HISTORY
========================= */
app.get('/api/history', async (req, res) => {
  try {
    const history = await Conversion.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(history);

  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({ error: 'History error' });
  }
});

/* =========================
   🚀 START SERVER + WORKER
========================= */
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // 🔥 START WORKER INSIDE BACKEND
    startWorker();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB error:', err));