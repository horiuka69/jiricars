import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Phone, Mail, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

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
            <span>+420 777 888 999</span>
          </div>
          <div className="contact-item">
            <Mail size={16} />
            <span>info@easyodtah.cz</span>
          </div>
          <div className="contact-item">
            <MapPin size={16} />
            <span>Průmyslová 12, Prague, CZ</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&copy; {new Date().getFullYear()} easyodtah.cz. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
