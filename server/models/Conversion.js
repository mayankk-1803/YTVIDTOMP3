import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  fileUrl: {
    type: String,
  },
  metadata: {
    title: String,
    duration: Number,
    thumbnail: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Conversion', conversionSchema);
