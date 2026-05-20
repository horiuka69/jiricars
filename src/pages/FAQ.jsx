import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './FAQ.css';

const FAQ = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    { q: 'faq.q1', a: 'faq.a1' },
    { q: 'faq.q2', a: 'faq.a2' },
    { q: 'faq.q1', a: 'faq.a1' }, // Dummy duplicates to fill out the page
    { q: 'faq.q2', a: 'faq.a2' },
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <PageTransition>
      <section className="faq-page container">
        <div className="faq-header">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            {t('faq.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Everything you need to know about navigating the Czech bureaucratic system for your car.
          </motion.p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              className={`faq-item glass-panel ${activeIndex === index ? 'active' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleAccordion(index)}
            >
              <div className="faq-question">
                <h3>{t(faq.q)}</h3>
                <motion.div 
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={24} className="faq-icon" />
                </motion.div>
              </div>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{t(faq.a)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            ))}
          </div>

          <div className="faq-documents">
            <h2>{t('faq.docs.title', 'Important Documents')}</h2>
            <p>{t('faq.docs.subtitle', 'Download the most needed forms for vehicle registration and STK.')}</p>
            <div className="docs-grid">
              <a href="#" className="doc-card glass-panel">
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <h4>{t('faq.docs.form1', 'Registration Form (Přihláška)')}</h4>
                  <span>PDF - 120KB</span>
                </div>
              </a>
              <a href="#" className="doc-card glass-panel">
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <h4>{t('faq.docs.form2', 'Power of Attorney (Plná moc)')}</h4>
                  <span>PDF - 85KB</span>
                </div>
              </a>
              <a href="#" className="doc-card glass-panel">
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <h4>{t('faq.docs.form3', 'Import Declaration')}</h4>
                  <span>PDF - 210KB</span>
                </div>
              </a>
            </div>
          </div>
        </section>
      </PageTransition>
    );
  };
  
  export default FAQ;
