import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, FileText, ArrowRight, Users, Compass } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <PageTransition>
      <div className="home-page">
        <section className="hero">
          <div className="hero-bg-glow"></div>
          <div className="container hero-content">
            <motion.div 
              className="hero-text"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants} className="hero-badge">
                <Users size={16} /> <span>{t('hero.badge')}</span>
              </motion.div>
              <motion.h1 variants={itemVariants} className="hero-title">
                {t('hero.title')}
              </motion.h1>
              <motion.p variants={itemVariants} className="hero-subtitle">
                {t('hero.subtitle')}
              </motion.p>
              <motion.div variants={itemVariants} className="hero-actions">
                <Link to="/forum" className="btn btn-primary">
                  {t('hero.cta')} <ArrowRight size={20} />
                </Link>
                <Link to="/blog" className="btn btn-outline">
                  {t('hero.cta2')}
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="hero-visual"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="abstract-community animate-float">
                <div className="chat-bubble chat-left glass-panel">
                  <MessageCircle size={24} className="text-primary"/>
                  <div className="chat-lines">
                    <div className="line line-short"></div>
                    <div className="line"></div>
                  </div>
                </div>
                <div className="chat-bubble chat-right glass-panel">
                  <Compass size={24} className="text-secondary"/>
                  <div className="chat-lines">
                    <div className="line"></div>
                    <div className="line line-short"></div>
                  </div>
                </div>
                <div className="glow-orb"></div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="features container">
          <div className="section-header">
            <h2>{t('home.explore.title')}</h2>
            <p>{t('home.explore.subtitle')}</p>
          </div>
          
          <div className="feature-grid">
            <motion.div 
              className="glass-panel feature-card"
              whileHover={{ y: -10 }}
            >
              <div className="feature-icon-wrapper">
                <MessageCircle size={32} className="feature-icon" />
              </div>
              <h3>{t('home.forums.title')}</h3>
              <p>{t('home.forums.desc')}</p>
              <Link to="/forum" className="feature-link">{t('home.forums.btn')} <ArrowRight size={16} /></Link>
            </motion.div>
            
            <motion.div 
              className="glass-panel feature-card"
              whileHover={{ y: -10 }}
            >
              <div className="feature-icon-wrapper">
                <FileText size={32} className="feature-icon" />
              </div>
              <h3>{t('home.blog.title')}</h3>
              <p>{t('home.blog.desc')}</p>
              <Link to="/blog" className="feature-link">{t('home.blog.btn')} <ArrowRight size={16} /></Link>
            </motion.div>

            <motion.div 
              className="glass-panel feature-card"
              whileHover={{ y: -10 }}
            >
              <div className="feature-icon-wrapper">
                <Compass size={32} className="feature-icon" />
              </div>
              <h3>{t('home.faq.title')}</h3>
              <p>{t('home.faq.desc')}</p>
              <Link to="/faq" className="feature-link">{t('home.faq.btn')} <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Home;
