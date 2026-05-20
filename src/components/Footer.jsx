import React from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Phone, Globe, Mail } from 'lucide-react';
import jiriMechanicCutout from '../assets/jirimechaniccutout.png';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo">
            <Car className="logo-icon" size={28} />
            <span>JiriCars</span>
          </div>
          <p>{t('footer.desc')}</p>
        </div>
        
        <div className="footer-social">
          <a href="#" className="social-icon"><Phone size={24} /></a>
          <a href="#" className="social-icon"><Globe size={24} /></a>
          <a href="#" className="social-icon"><Mail size={24} /></a>
        </div>
      </div>
      <div className="footer-bottom-wrapper">
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} JiriCars. {t('footer.rights')}</p>
        </div>
        <img src={jiriMechanicCutout} alt="Jiri Mechanic" className="footer-mechanic-cutout" />
      </div>
    </footer>
  );
};

export default Footer;
