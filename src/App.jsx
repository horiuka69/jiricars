import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Detailing from './pages/Detailing';
import Listings from './pages/Listings';
import Forum from './pages/Forum';
import Blog from './pages/Blog';
import Article from './pages/Article';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<Article />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/detailing" element={<Detailing />} />
            <Route path="/listings" element={<Listings />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

export default App;
