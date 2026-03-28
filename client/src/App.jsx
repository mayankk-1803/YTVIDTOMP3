import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HistoryPage from './pages/HistoryPage';
import { History, Home, Music } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

function Navbar() {
  const location = useLocation();
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b-0 border-white/5 bg-black/40 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide">AudioFlux</span>
        </Link>
        <div className="flex gap-2">
          <Link
            to="/"
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Home className="w-4 h-4" /> <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            to="/history"
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              location.pathname === '/history' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <History className="w-4 h-4" /> <span className="hidden sm:inline">History</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="w-full pt-20"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#06080c] relative overflow-hidden text-white font-sans selection:bg-purple-500/30">
        {/* Background Ambient Lights */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none transform -translate-x-1/2"></div>
        
        <Navbar />
        
        <Routes>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/history" element={<PageTransition><HistoryPage /></PageTransition>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
