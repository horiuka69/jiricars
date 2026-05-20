import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Car, ChevronDown } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">
          <Car className="logo-icon" size={32} />
          <span>JiriCars</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">{t('nav.home')}</Link>
          <Link to="/forum" className="nav-link">{t('nav.forum')}</Link>
          <Link to="/blog" className="nav-link">{t('nav.blog')}</Link>
          <Link to="/faq" className="nav-link">{t('nav.faq')}</Link>
          <Link to="/detailing" className="nav-link">{t('nav.detailing')}</Link>
          <Link to="/listings" className="nav-link">{t('nav.listings')}</Link>
        </div>

        <div className="lang-switcher">
          <Globe size={20} />
          <select 
            value={i18n.language} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="lang-select"
          >
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="cs">CS</option>
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
