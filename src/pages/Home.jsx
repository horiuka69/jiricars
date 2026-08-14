import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Send, Calendar, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2000",
    "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2000",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2000"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <PageTransition>
      <div className="home-page">
        {/* Fullscreen Hero with Fading Slideshow */}
        <section className="hero">
          <div className="hero-slideshow">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                className="hero-slide-bg"
                style={{ backgroundImage: `url(${slides[slideIndex]})` }}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.45, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </AnimatePresence>
            <div className="hero-overlay-shade"></div>
          </div>

          <div className="container hero-content">
            <motion.div 
              className="hero-text"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants} className="hero-badge">
                <ShieldCheck size={16} /> <span>100% Certified Import Services</span>
              </motion.div>
              <motion.h1 variants={itemVariants} className="hero-title">
                {t('home.hero.title')}
              </motion.h1>
              <motion.p variants={itemVariants} className="hero-subtitle">
                {t('home.hero.subtitle')}
              </motion.p>
              <motion.div variants={itemVariants} className="hero-actions">
                <Link to="/contact" className="btn btn-primary">
                  {t('nav.contact')} <ArrowRight size={20} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Normal Content Section (Scrolls naturally) */}
        <section className="features container">
          <div className="section-header">
            <h2>{t('home.features.title')}</h2>
            <p>{t('home.features.subtitle')}</p>
          </div>
          
          <div className="feature-grid">
            <motion.div 
              className="glass-panel feature-card"
              whileHover={{ y: -8, borderColor: 'var(--primary-color)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="feature-icon-wrapper blue-glow">
                <Car size={32} className="feature-icon" />
              </div>
              <h3>{t('home.feat.market.title')}</h3>
              <p>{t('home.feat.market.desc')}</p>
              <Link to="/listings" className="feature-link">{t('home.hero.cta.marketplace')} <ArrowRight size={16} /></Link>
            </motion.div>
            
            <motion.div 
              className="glass-panel feature-card"
              whileHover={{ y: -8, borderColor: 'var(--secondary-color)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="feature-icon-wrapper cyan-glow">
                <Send size={32} className="feature-icon" />
              </div>
              <h3>{t('home.feat.tow.title')}</h3>
              <p>{t('home.feat.tow.desc')}</p>
              <Link to="/inquiry" className="feature-link">{t('home.hero.cta.inquiry')} <ArrowRight size={16} /></Link>
            </motion.div>

            <motion.div 
              className="glass-panel feature-card"
              whileHover={{ y: -8, borderColor: 'var(--primary-color)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="feature-icon-wrapper blue-glow">
                <Calendar size={32} className="feature-icon" />
              </div>
              <h3>{t('home.feat.rental.title')}</h3>
              <p>{t('home.feat.rental.desc')}</p>
              <Link to="/rental" className="feature-link">{t('nav.rental')} <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Home;
