import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Inquiry.css';

const Inquiry = () => {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'inquiry',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        })
      });
      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error('Failed to submit inquiry via email');
      }
    } catch (err) {
      console.error('Error submitting inquiry form:', err);
    }
  };

  return (
    <PageTransition>
      <section className="inquiry-page container">
        <div className="inquiry-header">
          <h1>{t('inquiry.title')}</h1>
          <p>{t('inquiry.subtitle')}</p>
        </div>

        <div className="inquiry-wizard glass-panel">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div 
                className="submission-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CheckCircle2 size={64} className="success-icon" />
                <h2>Success!</h2>
                <p>{t('inquiry.success')}</p>
                <div className="summary-box">
                  <h4>{t('inquiry.lbl.name')}:</h4>
                  <p>{formData.fullName}</p>
                  <h4 style={{ marginTop: '1rem' }}>{t('inquiry.lbl.phone')}:</h4>
                  <p>{formData.phone}</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => { 
                    setIsSubmitted(false); 
                    setFormData({ fullName: '', email: '', phone: '', message: '' }); 
                  }}
                >
                  {t('nav.inquiry')}
                </button>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="step-form-content"
              >
                <div className="inquiry-intro-card">
                  <p>{t('inquiry.intro')}</p>
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.name')}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Jan Novák"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.email')}</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="e.g. jan.novak@example.cz"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.phone')}</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. +420 123 456 789"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.message')}</label>
                  <textarea 
                    required 
                    rows={5}
                    placeholder="..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-light)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div className="wizard-actions" style={{ marginTop: '1rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!formData.fullName || !formData.email || !formData.phone || !formData.message}
                  >
                    {t('inquiry.btn.submit')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
};

export default Inquiry;

