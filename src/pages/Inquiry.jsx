import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
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
      // 1. Create Firestore Conversation
      const conversationData = {
        customerName: formData.fullName,
        customerEmail: formData.email,
        phone: formData.phone || '',
        subject: `Poptávka odtahu / Transport Inquiry`,
        lastMessageAt: new Date().toISOString(),
        messages: [
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'customer',
            senderName: formData.fullName,
            senderEmail: formData.email,
            body: formData.message || 'No description provided.',
            timestamp: new Date().toISOString()
          }
        ]
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);

      // 2. Send email notification
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'inquiry',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          conversationId: docRef.id
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
                <h2>{t('inquiry.success.title')}</h2>
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
                    placeholder={t('inquiry.placeholder.name')}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.email')}</label>
                  <input 
                    type="email" 
                    required 
                    placeholder={t('inquiry.placeholder.email')}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.phone')}</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder={t('inquiry.placeholder.phone')}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('inquiry.lbl.message')}</label>
                  <textarea 
                    required 
                    rows={5}
                    placeholder={t('inquiry.placeholder.message')}
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

