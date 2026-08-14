import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Cpu, Fuel, Award, HelpCircle, Calculator, Info, CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import towTruckImg from '../assets/tow_truck_rental.jpg';
import './Rental.css';

const Rental = () => {
  const { t } = useTranslation();
  
  // Calculator states
  const [distance, setDistance] = useState(500);
  const [destination, setDestination] = useState('cz'); // 'cz' or 'eu'

  // Pricing constants
  const RATE_PER_KM = 5.5;
  const CZ_MIN_KM = 450;
  const CZ_MIN_PRICE = 2500;
  const EU_MIN_KM = 635;
  const EU_MIN_PRICE = 3500;
  const DEPOSIT = 10000;
  const EUR_RATE = 25; // 1 EUR = 25 CZK

  // Calculations
  const calculateRentalPrice = () => {
    const parsedDistance = Number(distance) || 0;
    if (destination === 'cz') {
      if (parsedDistance <= CZ_MIN_KM) return CZ_MIN_PRICE;
      return Math.round(CZ_MIN_PRICE + (parsedDistance - CZ_MIN_KM) * RATE_PER_KM);
    } else {
      if (parsedDistance <= EU_MIN_KM) return EU_MIN_PRICE;
      return Math.round(EU_MIN_PRICE + (parsedDistance - EU_MIN_KM) * RATE_PER_KM);
    }
  };

  const rentalPriceCzk = calculateRentalPrice();
  const rentalPriceEur = Math.round(rentalPriceCzk / EUR_RATE);
  const depositEur = Math.round(DEPOSIT / EUR_RATE);
  
  const totalCzk = rentalPriceCzk + DEPOSIT;
  const totalEur = rentalPriceEur + depositEur;

  // Specs array
  const specs = [
    { label: t('rental.specs.engine'), icon: <Fuel size={18} /> },
    { label: t('rental.specs.transmission'), icon: <Cpu size={18} /> },
    { label: t('rental.specs.bed'), icon: <Shield size={18} /> },
    { label: t('rental.specs.payload'), icon: <Award size={18} /> },
    { label: t('rental.specs.towing'), icon: <Award size={18} /> },
    { label: t('rental.specs.winch'), icon: <Cpu size={18} /> },
    { label: t('rental.specs.speed'), icon: <Fuel size={18} /> },
    { label: t('rental.specs.tank'), icon: <Fuel size={18} /> },
    { label: t('rental.specs.seats'), icon: <Shield size={18} /> },
    { label: t('rental.specs.sleeping'), icon: <Shield size={18} /> },
    { label: t('rental.specs.heating'), icon: <Cpu size={18} /> },
    { label: t('rental.specs.suspension'), icon: <Cpu size={18} /> }
  ];

  return (
    <PageTransition>
      <section className="rental-page container">
        <div className="rental-header">
          <h1>{t('rental.title')}</h1>
          <p>{t('rental.subtitle')}</p>
        </div>

        <div className="rental-layout">
          {/* Left Column: Image and Full Specs List */}
          <div className="rental-details">
            <div className="tow-truck-preview glass-panel">
              <img src={towTruckImg} alt="Citroën Jumper" className="tow-image" />
              <div className="image-badge">easyodtah.cz</div>
            </div>

            <div className="specs-card glass-panel">
              <h3>{t('rental.specs.title')}</h3>
              
              <div className="specs-detail-list">
                <p className="specs-main-desc">
                  <strong>Citroën Jumper 3.0 HDi (116 kW / 157 koní)</strong> s pohonem přední nápravy (FWD).
                </p>
                <div className="specs-detail-grid">
                  {specs.map((spec, index) => (
                    <div key={index} className="spec-detail-item">
                      <span className="spec-detail-icon">{spec.icon}</span>
                      <span className="spec-detail-text">{spec.label}</span>
                    </div>
                  ))}
                </div>
                <div className="specs-equipment-box">
                  <strong>{t('rental.specs.equipment').split(':')[0]}:</strong>
                  <p>{t('rental.specs.equipment').substring(t('rental.specs.equipment').indexOf(':') + 1).trim()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing and Price Calculator */}
          <div className="rental-booking">
            {/* Pricing Info Card */}
            <div className="calendar-card glass-panel" style={{ marginBottom: '2rem' }}>
              <div className="calendar-header">
                <Award size={22} className="cal-icon" />
                <h3>{t('rental.pricing.title')}</h3>
              </div>
              <div className="pricing-text-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="pricing-rates-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>{t('rental.pricing.main')}</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, margin: 0 }}>
                    <li style={{ fontSize: '0.95rem' }}>
                      🇨🇿 <strong style={{ color: 'var(--secondary-color)' }}>{t('rental.pricing.cz_val')}</strong> ({t('rental.pricing.cz_limit').split(' ')[0]} <strong style={{ color: 'var(--text-light)' }}>{t('rental.pricing.cz_limit').split(' ')[1]} {t('rental.pricing.cz_limit').split(' ')[2]}</strong>) {t('rental.pricing.cz_desc')}
                    </li>
                    <li style={{ fontSize: '0.95rem' }}>
                      🇪🇺 <strong style={{ color: 'var(--secondary-color)' }}>{t('rental.pricing.eu_val')}</strong> ({t('rental.pricing.eu_limit').split(' ')[0]} <strong style={{ color: 'var(--text-light)' }}>{t('rental.pricing.eu_limit').split(' ')[1]} {t('rental.pricing.eu_limit').split(' ')[2]}</strong>) {t('rental.pricing.eu_desc')}
                    </li>
                    <li style={{ fontSize: '0.95rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.5rem', marginTop: '0.3rem', color: 'var(--text-main)' }}>
                      ⚠️ {t('rental.pricing.extra_label')}: <strong style={{ color: 'var(--text-light)' }}>{t('rental.pricing.extra_val')}</strong>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('rental.pricing.deposit_title')}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{t('rental.pricing.deposit_desc')}</p>
                </div>

                <div>
                  <h4 style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('rental.pricing.req_title')}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{t('rental.pricing.req_desc')}</p>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', fontStyle: 'italic', marginTop: '0.1rem' }}>{t('rental.pricing.vat')}</p>
              </div>
            </div>

            {/* Price Calculator */}
            <div className="calendar-card glass-panel">
              <div className="calendar-header">
                <Calculator size={22} className="cal-icon" />
                <h3>{t('rental.calc.title')}</h3>
              </div>
              <p className="calendar-sub">{t('rental.calc.info')}</p>

              <div className="calculator-form">
                {/* Destination Toggle */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.5rem', display: 'block', textTransform: 'uppercase' }}>
                    {t('rental.calc.dest')}
                  </label>
                  <div className="dest-toggle-grid">
                    <button 
                      type="button"
                      className={`dest-btn ${destination === 'cz' ? 'active' : ''}`}
                      onClick={() => setDestination('cz')}
                    >
                      {t('rental.calc.dest.cz')}
                    </button>
                    <button 
                      type="button"
                      className={`dest-btn ${destination === 'eu' ? 'active' : ''}`}
                      onClick={() => setDestination('eu')}
                    >
                      {t('rental.calc.dest.eu')}
                    </button>
                  </div>
                </div>

                {/* Distance Slider & Input */}
                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                      {t('rental.calc.distance')}
                    </label>
                    <input 
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{
                        width: '80px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        color: 'var(--text-light)',
                        padding: '0.25rem 0.5rem',
                        textAlign: 'right',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    />
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="3000"
                    step="10"
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--secondary-color)',
                      cursor: 'pointer',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  {destination === 'cz' && distance < CZ_MIN_KM && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary-color)', display: 'block', marginTop: '0.4rem' }}>
                      * {t('rental.calc.dest.cz')}: Limit {CZ_MIN_KM} km
                    </span>
                  )}
                  {destination === 'eu' && distance < EU_MIN_KM && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary-color)', display: 'block', marginTop: '0.4rem' }}>
                      * {t('rental.calc.dest.eu')}: Limit {EU_MIN_KM} km
                    </span>
                  )}
                </div>

                {/* Calculation breakdown */}
                <div className="calculation-results" style={{ marginTop: '2rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>{t('rental.calc.rental')}:</span>
                    <strong style={{ color: 'var(--text-light)' }}>{rentalPriceCzk.toLocaleString()} Kč / {rentalPriceEur.toLocaleString()} €</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>{t('rental.calc.deposit')}:</span>
                    <strong style={{ color: 'var(--text-light)' }}>{DEPOSIT.toLocaleString()} Kč / {depositEur.toLocaleString()} €</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--secondary-color)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('rental.calc.total')}
                    </span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-light)', background: 'linear-gradient(135deg, #fff 50%, var(--secondary-color) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {totalCzk.toLocaleString()} Kč
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      ~ {totalEur.toLocaleString()} €
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Rental;

