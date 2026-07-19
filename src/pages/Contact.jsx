import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Contact.css';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
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
                  <strong>Phone</strong>
                  <span>+420 777 888 999</span>
                </div>
              </div>

              <div className="contact-detail-item">
                <Mail size={22} className="contact-icon" />
                <div>
                  <strong>Email</strong>
                  <span>info@easyodtah.cz</span>
                </div>
              </div>

              <div className="contact-detail-item">
                <MapPin size={22} className="contact-icon" />
                <div>
                  <strong>Location</strong>
                  <span>Průmyslová 12, Prague, Czech Republic</span>
                </div>
              </div>
            </div>

            <div className="hours-card glass-panel">
              <h3>{t('contact.hours.title')}</h3>
              
              <div className="hours-detail-item">
                <Clock size={20} className="hours-icon" />
                <div className="hours-row">
                  <span>Monday - Friday</span>
                  <strong>08:00 - 18:00</strong>
                </div>
              </div>

              <div className="hours-detail-item">
                <Clock size={20} className="hours-icon" />
                <div className="hours-row">
                  <span>Saturday</span>
                  <strong>09:00 - 14:00</strong>
                </div>
              </div>

              <div className="hours-detail-item">
                <Clock size={20} className="hours-icon" />
                <div className="hours-row">
                  <span>Sunday</span>
                  <strong>Closed / On Call</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact form & Mock map */}
          <div className="contact-form-panel">
            <div className="contact-form-card glass-panel">
              <h3>{t('contact.form.title')}</h3>

              {isSubmitted ? (
                <div className="form-success-message">
                  <CheckCircle2 size={48} className="success-icon" />
                  <h4>Message Sent!</h4>
                  <p>{t('contact.form.success')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. David Novak"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. david@example.cz"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Subject</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Sourcing Inquiry"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Message</label>
                    <textarea 
                      required 
                      rows="5" 
                      placeholder="Type your message details here..."
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

            {/* Stylized Mock Map */}
            <div className="mock-map glass-panel">
              <div className="map-radar"></div>
              <div className="map-pin-pulse">
                <MapPin size={24} fill="currentColor" />
              </div>
              <span className="map-label">easyodtah.cz Headquarters - Prague</span>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Contact;
