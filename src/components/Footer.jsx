import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Phone, Mail, MapPin } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();
  const { setLoginModalOpen, isAdmin } = useAdmin();
  const [clickCount, setClickCount] = useState(0);

  const handleCopyrightClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setLoginModalOpen(true);
        return 0;
      }
      return next;
    });
  };

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo">
            <Car className="logo-icon" size={28} />
            <span>easyodtah.cz</span>
          </div>
          <p className="footer-desc">{t('footer.desc')}</p>
        </div>

        <div className="footer-nav">
          <h4>{t('nav.home')}</h4>
          <ul>
            <li><Link to="/listings">{t('nav.listings')}</Link></li>
            <li><Link to="/inquiry">{t('nav.inquiry')}</Link></li>
            <li><Link to="/rental">{t('nav.rental')}</Link></li>
          </ul>
        </div>

        <div className="footer-nav">
          <h4>Info</h4>
          <ul>
            <li><Link to="/reviews">{t('nav.reviews')}</Link></li>
            <li><Link to="/contact">{t('nav.contact')}</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>{t('nav.contact')}</h4>
          <div className="contact-item">
            <Phone size={16} />
            <span>+420 732 918 998</span>
          </div>
          <div className="contact-item">
            <Mail size={16} />
            <span>info@easyodtah.cz</span>
          </div>
          <div className="contact-item">
            <MapPin size={16} />
            <span>Všetaty u Rakovníka, 270 21</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p onClick={handleCopyrightClick} style={{ cursor: 'default', userSelect: 'none' }}>
            &copy; {new Date().getFullYear()} easyodtah.cz. {t('footer.rights')}
            {isAdmin && <span style={{ color: 'var(--secondary-color)', marginLeft: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>(ADMIN MODE ACTIVE)</span>}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
