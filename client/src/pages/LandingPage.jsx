import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowRight, CheckCircle, Download, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, completed
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let interval;
    if (status === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/status/${jobId}`);
          if (res.data.status === 'completed') {
            setStatus('completed');
            setResult(res.data);
            toast.success('Conversion completed successfully!');
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setStatus('idle');
            toast.error('Conversion failed. Please try again.');
            clearInterval(interval);
          }
        } catch (error) {
          console.error(error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, jobId]);

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!url) return toast.warn('Please enter a YouTube URL');
    
    try {
      setStatus('processing');
      const res = await axios.post('/api/convert', { url });
      setJobId(res.data.jobId);
      toast.info('Conversion started...');
    } catch (error) {
      setStatus('idle');
      toast.error(error.response?.data?.error || 'Failed to start conversion');
    }
  };

  const reset = () => {
    setUrl('');
    setStatus('idle');
    setJobId(null);
    setResult(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto">
      <ToastContainer theme="dark" position="bottom-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl glass">
            <Music className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            AudioFlux
          </h1>
        </div>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Convert YouTube videos to high-quality MP3 instantly. 
          Experience the sleekest and fastest converter.
        </p>
      </motion.div>

      <div className="w-full max-w-2xl z-10">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass p-8 rounded-3xl"
            >
              <form onSubmit={handleConvert} className="flex flex-col gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube Link Here..."
                    className="relative w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder:text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg py-5 px-8 rounded-2xl transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] flex items-center justify-center gap-3 group"
                >
                  <span className="relative z-10">Convert Now</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-center"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                Extracting Audio Magic...
              </h3>
              <p className="text-gray-400">This usually takes a few seconds to a minute.</p>
            </motion.div>
          )}

          {status === 'completed' && result && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-3xl flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Conversion Complete!</h3>
              <p className="text-gray-400 mb-8 truncate w-full text-center max-w-sm">
                Audio ready for download.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <a 
                  href={`/api/download/${result._id}`}
                  download
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                >
                  <Download className="w-5 h-5" />
                  Download MP3
                </a>
                <button
                  onClick={reset}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Convert Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
