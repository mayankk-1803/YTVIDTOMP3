import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowRight, CheckCircle, Download, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL;

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let interval;
    if (status === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/api/status/${jobId}`);
          
          if (res.data.status === 'completed') {
            setStatus('completed');
            setResult(res.data);
            toast.success('Conversion completed successfully!');
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setStatus('idle');
            toast.error('Conversion failed');
            clearInterval(interval);
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, jobId]);

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!url) return toast.warn('Enter a YouTube URL');

    try {
      setStatus('processing');
      const res = await axios.post(`${API_URL}/api/convert`, { url });
      setJobId(res.data.jobId);
      toast.info('Conversion started...');
    } catch (err) {
      setStatus('idle');
      toast.error('Failed to start conversion');
    }
  };

  const reset = () => {
    setUrl('');
    setStatus('idle');
    setJobId(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <ToastContainer theme="dark" />

      <h1 className="text-4xl font-bold mb-6">AudioFlux</h1>

      {status === 'idle' && (
        <form onSubmit={handleConvert} className="flex gap-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL"
            className="p-3 rounded bg-black border"
          />
          <button className="bg-purple-600 px-6 py-3 rounded">Convert</button>
        </form>
      )}

      {status === 'processing' && (
        <p className="mt-6">Processing...</p>
      )}

      {status === 'completed' && result && (
        <div className="mt-6 flex flex-col gap-4">
          <a
            href={`${API_URL}/api/download/${result._id}`}
            className="bg-green-600 px-6 py-3 rounded"
          >
            Download MP3
          </a>

          <button onClick={reset} className="bg-gray-600 px-6 py-3 rounded">
            Convert Again
          </button>
        </div>
      )}
    </div>
  );
}