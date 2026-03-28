import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import path from 'path';
import fs from 'fs';

import Conversion from './models/Conversion.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/audioflux';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Setup BullMQ Queue
export const conversionQueue = new Queue('conversionQueue', {
  connection: {
    url: REDIS_URL,
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/convert', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Create DB entry
    const conversion = new Conversion({ url, status: 'pending' });
    await conversion.save();

    // Add job to queue
    await conversionQueue.add('convert-mp3', {
      conversionId: conversion._id,
      url,
    });

    res.status(202).json({ 
      message: 'Conversion started',
      jobId: conversion._id 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start conversion' });
  }
});

app.get('/api/download/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findById(req.params.id);
    if (!conversion || conversion.status !== 'completed' || !conversion.fileUrl) {
      return res.status(404).json({ error: 'File not ready or found' });
    }
    
    // Redirect to the Cloudinary URL
    res.redirect(conversion.fileUrl);
  } catch (error) {
    res.status(500).json({ error: 'Error processing download request' });
  }
});

app.get('/api/status/:id', async (req, res) => {
  try {
    const conversion = await Conversion.findById(req.params.id);
    if (!conversion) return res.status(404).json({ error: 'Not found' });
    res.json(conversion);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching status' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await Conversion.find().sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching history' });
  }
});

// Connect DB and Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
