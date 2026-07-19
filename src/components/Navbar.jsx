import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Car, ChevronDown, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/listings', labelKey: 'nav.listings' },
    { path: '/inquiry', labelKey: 'nav.inquiry' },
    { path: '/rental', labelKey: 'nav.rental' },
    { path: '/reviews', labelKey: 'nav.reviews' },
    { path: '/contact', labelKey: 'nav.contact' },
  ];

  const languages = [
    { code: 'cs', label: 'CZ', flag: '🇨🇿' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' }
  ];

  const currentLanguageObj = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <nav className="navbar glass-panel">
      <div className="container nav-container">
        <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          <Car className="logo-icon" size={28} />
          <span>easyodtah.cz</span>
        </Link>
        
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="nav-right">
          {/* Custom Lang Selector Dropdown */}
          <div className="custom-lang-selector" ref={dropdownRef}>
            <button 
              className="lang-trigger-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            >
              <Globe size={17} />
              <span className="current-flag">{currentLanguageObj.flag}</span>
              <span className="current-label">{currentLanguageObj.label}</span>
              <ChevronDown size={14} className={`chevron-icon ${langDropdownOpen ? 'open' : ''}`} />
            </button>

            {langDropdownOpen && (
              <div className="lang-dropdown-menu glass-panel">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`lang-option-btn ${i18n.language === lang.code ? 'selected' : ''}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span className="option-flag">{lang.flag}</span>
                    <span className="option-label">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
