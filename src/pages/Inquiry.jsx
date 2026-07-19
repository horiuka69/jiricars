import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, ShieldCheck, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Inquiry.css';

const Inquiry = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    makeModel: '',
    year: '',
    condition: 'running', // running or nonrunning
    pickup: '',
    delivery: '',
    date: '',
    transportClass: 'standard', // standard or covered
    fullName: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  // Step indicator details
  const steps = [
    { num: 1, label: t('inquiry.step1'), icon: <Truck size={18} /> },
    { num: 2, label: t('inquiry.step2'), icon: <MapPin size={18} /> },
    { num: 3, label: t('inquiry.step3'), icon: <ShieldCheck size={18} /> },
    { num: 4, label: t('inquiry.step4'), icon: <Mail size={18} /> }
  ];

  return (
    <PageTransition>
      <section className="inquiry-page container">
        <div className="inquiry-header">
          <h1>{t('inquiry.title')}</h1>
          <p>{t('inquiry.subtitle')}</p>
        </div>

        <div className="inquiry-wizard glass-panel">
          {/* Progress Indicators */}
          <div className="wizard-progress">
            {steps.map((s) => (
              <div 
                key={s.num} 
                className={`progress-node ${currentStep === s.num ? 'active' : ''} ${currentStep > s.num ? 'completed' : ''}`}
              >
                <div className="node-icon">
                  {currentStep > s.num ? <CheckCircle2 size={18} /> : s.icon}
                </div>
                <span className="node-label">{s.label}</span>
                {s.num < 4 && <div className="node-connector"></div>}
              </div>
            ))}
          </div>

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
                  <h4>Inquiry Details:</h4>
                  <ul>
                    <li><strong>Vehicle:</strong> {formData.makeModel} ({formData.year})</li>
                    <li><strong>Route:</strong> {formData.pickup} → {formData.delivery}</li>
                    <li><strong>Transport Type:</strong> {formData.transportClass === 'covered' ? 'Covered Trailer' : 'Standard Open Deck'}</li>
                    <li><strong>Client:</strong> {formData.fullName} ({formData.phone})</li>
                  </ul>
                </div>
                <button className="btn btn-primary" onClick={() => { setIsSubmitted(false); setCurrentStep(1); }}>
                  New Inquiry
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key={currentStep}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="step-form-content"
              >
                {/* STEP 1: VEHICLE DETAILS */}
                {currentStep === 1 && (
                  <div className="form-step">
                    <div className="form-group">
                      <label>{t('inquiry.lbl.make')}</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Porsche 911 GT3"
                        value={formData.makeModel}
                        onChange={(e) => handleInputChange('makeModel', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('inquiry.lbl.year')}</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="e.g. 2022"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('inquiry.lbl.condition')}</label>
                      <div className="radio-options">
                        <label className={`radio-card ${formData.condition === 'running' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="condition"
                            value="running"
                            checked={formData.condition === 'running'}
                            onChange={() => handleInputChange('condition', 'running')}
                          />
                          <span>{t('inquiry.cond.run')}</span>
                        </label>
                        <label className={`radio-card ${formData.condition === 'nonrunning' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="condition"
                            value="nonrunning"
                            checked={formData.condition === 'nonrunning'}
                            onChange={() => handleInputChange('condition', 'nonrunning')}
                          />
                          <span>{t('inquiry.cond.nonrun')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: LOGISTICS */}
                {currentStep === 2 && (
                  <div className="form-step">
                    <div className="form-group">
                      <label>{t('inquiry.lbl.pickup')}</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Munich, Germany"
                        value={formData.pickup}
                        onChange={(e) => handleInputChange('pickup', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('inquiry.lbl.delivery')}</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Prague, Czech Republic"
                        value={formData.delivery}
                        onChange={(e) => handleInputChange('delivery', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('inquiry.lbl.date')}</label>
                      <input 
                        type="date" 
                        required 
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: TRANSPORT CLASS */}
                {currentStep === 3 && (
                  <div className="form-step">
                    <label className="form-section-title">{t('inquiry.lbl.class')}</label>
                    <div className="transport-class-selector">
                      <label className={`class-card ${formData.transportClass === 'standard' ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="transportClass"
                          value="standard"
                          checked={formData.transportClass === 'standard'}
                          onChange={() => handleInputChange('transportClass', 'standard')}
                        />
                        <div className="class-details">
                          <strong>Standard Open Deck</strong>
                          <p>{t('inquiry.class.std')}</p>
                          <span className="price-tag">Economy / Fast</span>
                        </div>
                      </label>

                      <label className={`class-card ${formData.transportClass === 'covered' ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="transportClass"
                          value="covered"
                          checked={formData.transportClass === 'covered'}
                          onChange={() => handleInputChange('transportClass', 'covered')}
                        />
                        <div className="class-details">
                          <strong>Covered Enclosed Trailer</strong>
                          <p>{t('inquiry.class.covered')}</p>
                          <span className="price-tag">Premium / Insured</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 4: CONTACT & REVIEW */}
                {currentStep === 4 && (
                  <div className="form-step">
                    <div className="form-group">
                      <label>{t('inquiry.lbl.name')}</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('inquiry.lbl.email')}</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('inquiry.lbl.phone')}</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="+420 123 456 789"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>

                    <div className="review-box">
                      <h4>Please review your inquiry:</h4>
                      <p>Importing <strong>{formData.makeModel || 'N/A'} ({formData.year || 'N/A'})</strong> from <strong>{formData.pickup || 'N/A'}</strong> to <strong>{formData.delivery || 'N/A'}</strong> via <strong>{formData.transportClass === 'covered' ? 'Covered Enclosed Trailer' : 'Standard Open Deck'}</strong>.</p>
                    </div>
                  </div>
                )}

                {/* Wizard Buttons */}
                <div className="wizard-actions">
                  {currentStep > 1 && (
                    <button type="button" className="btn btn-outline" onClick={prevStep}>
                      <ArrowLeft size={16} /> {t('inquiry.btn.back')}
                    </button>
                  )}
                  {currentStep < 4 ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={nextStep}
                      disabled={
                        (currentStep === 1 && (!formData.makeModel || !formData.year)) ||
                        (currentStep === 2 && (!formData.pickup || !formData.delivery || !formData.date))
                      }
                    >
                      {t('inquiry.btn.next')} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!formData.fullName || !formData.email || !formData.phone}
                    >
                      {t('inquiry.btn.submit')}
                    </button>
                  )}
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
