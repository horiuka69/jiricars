import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import './Contact.css';

const FacebookIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Contact = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Check if we have an inquiry parameter in the URL (e.g. from marketplace car cards)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const carInquiry = searchParams.get('inquiry');
    if (carInquiry) {
      setFormData(prev => ({
        ...prev,
        subject: `Inquiry regarding: ${decodeURIComponent(carInquiry)}`,
        message: `Hello, I am interested in purchasing the ${decodeURIComponent(carInquiry)} listed on your marketplace. Please send me more details.`
      }));
    }
  }, [location]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Create Firestore Conversation
      const conversationData = {
        customerName: formData.name,
        customerEmail: formData.email,
        phone: '',
        subject: formData.subject || 'Obecný dotaz / General Contact',
        lastMessageAt: new Date().toISOString(),
        messages: [
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'customer',
            senderName: formData.name,
            senderEmail: formData.email,
            body: formData.message || '',
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
          formType: 'contact',
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          conversationId: docRef.id
        })
      });
      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 4000);
      } else {
        console.error('Failed to send contact message via email');
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
    }
  };

  return (
    <PageTransition>
      <section className="contact-page container">
        <div className="contact-header">
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>

        <div className="contact-layout">
          {/* Left Column: Contact details */}
          <div className="contact-info-panel">
            <div className="contact-card glass-panel">
              <h3>{t('contact.info.title')}</h3>
              
              <div className="contact-detail-item">
                <Phone size={22} className="contact-icon" />
                <div>
                  <strong>{t('contact.lbl.phone')}</strong>
                  <span>+420 737 218 650</span>
                </div>
              </div>

              <div className="contact-detail-item">
                <Mail size={22} className="contact-icon" />
                <div>
                  <strong>{t('contact.lbl.email')}</strong>
                  <span>info@easyodtah.cz</span>
                </div>
              </div>

              <div className="contact-detail-item">
                <MapPin size={22} className="contact-icon" />
                <div>
                  <strong>{t('contact.lbl.location')}</strong>
                  <span>Všetaty u Rakovníka, 270 21</span>
                </div>
              </div>

              <a 
                href="https://www.facebook.com/profile.php?id=61593142448733" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-detail-item facebook-link"
                style={{ textDecoration: 'none' }}
              >
                <FacebookIcon size={22} className="contact-icon" />
                <div>
                  <strong>{t('contact.lbl.facebook')}</strong>
                  <span>{t('contact.facebook')}</span>
                </div>
              </a>
            </div>            
          </div>

          {/* Right Column: Contact form & Mock map */}
          <div className="contact-form-panel">
            <div className="contact-form-card glass-panel">
              <h3>{t('contact.form.title')}</h3>

              {isSubmitted ? (
                <div className="form-success-message">
                  <CheckCircle2 size={48} className="success-icon" />
                  <h4>{t('contact.success.title')}</h4>
                  <p>{t('contact.form.success')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label>{t('contact.form.name')}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder={t('contact.placeholder.name')}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('contact.form.email')}</label>
                    <input 
                      type="email" 
                      required 
                      placeholder={t('contact.placeholder.email')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('contact.form.subject')}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder={t('contact.placeholder.subject')}
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('contact.form.message')}</label>
                    <textarea 
                      required 
                      rows="5" 
                      placeholder={t('contact.placeholder.message')}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    {t('contact.form.btn')} <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Contact;
