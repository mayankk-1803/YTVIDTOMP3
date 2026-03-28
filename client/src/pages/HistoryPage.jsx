import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Download, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/history');
        setHistory(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 w-full max-w-5xl mx-auto flex flex-col mt-10 z-10 relative">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-3 bg-blue-500/20 rounded-2xl glass">
          <History className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            Conversion History
          </h2>
          <p className="text-gray-400">Your recent downloads.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center flex flex-col items-center">
          <Clock className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">No conversions yet</h3>
          <p className="text-gray-500 mt-2">Go to the home page to start converting your first video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={item._id}
              className="glass p-6 rounded-2xl flex flex-col justify-between hover:bg-white/5 transition-colors group"
            >
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium uppercase tracking-wider ${
                    item.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                    item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' : 
                    item.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/20'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-gray-300 hover:text-white flex items-center gap-2 mb-1 truncate">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate w-[80%]">{item.url}</span>
                </a>
              </div>
              
              <div className="mt-auto">
                {item.status === 'completed' ? (
                  <a
                    href={`/api/download/${item._id}`}
                    download
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all group-hover:bg-blue-600/20 group-hover:border-blue-500/30 group-hover:text-blue-300"
                  >
                    <Download className="w-4 h-4" /> Download MP3
                  </a>
                ) : item.status === 'failed' ? (
                  <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Failed
                  </div>
                ) : (
                  <div className="w-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                    Processing...
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
