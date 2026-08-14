import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Clock, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './TowingServices.css';

const TowingServices = () => {
  const { t } = useTranslation();

  useEffect(() => {
    let mapInstance = null;

    const initMap = () => {
      if (!window.L || mapInstance) return;
      
      const mapContainer = document.getElementById('emergency-map');
      if (!mapContainer) return;

      // Latitude: 50.0461, Longitude: 13.7578 (Všetaty u Rakovníka)
      const center = [50.0461, 13.7578];
      
      mapInstance = window.L.map('emergency-map', {
        center: center,
        zoom: 9,
        scrollWheelZoom: false
      });
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance);

      // Marker for Všetaty
      window.L.marker(center).addTo(mapInstance)
        .bindPopup('Všetaty u Rakovníka')
        .openPopup();

      // 30km circle (30,000 meters)
      window.L.circle(center, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        radius: 30000
      }).addTo(mapInstance);
    };

    // Load Leaflet assets
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // Cleanup map on unmount
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    };
  }, []);

  return (
    <PageTransition>
      <section className="towing-services-page container">
        <div className="towing-header">
          <div className="emergency-badge">
            <AlertTriangle size={16} />
            <span>EMERGENCY ASSISTANCE 24/7</span>
          </div>
          <h1>{t('towing.title')}</h1>
          <p style={{ fontWeight: 600, fontSize: '1.25rem', color: 'var(--text-light)' }}>
            {t('towing.subtitle')}
          </p>
        </div>

        <div className="towing-grid">
          {/* Emergency Hotline & Pricing */}
          <div className="towing-left-col">
            <div className="emergency-call-card glass-panel">
              <div className="pulse-circle">
                <Phone size={36} className="pulse-icon" />
              </div>
              <h2>{t('towing.emergency.title')}</h2>
              <p>{t('towing.emergency.desc')}</p>
              <a href="tel:+420777888999" className="emergency-dial-btn btn btn-primary">
                <Phone size={20} />
                <span>{t('towing.emergency.btn')}</span>
              </a>
              <div className="availability-notice">
                <Clock size={16} />
                <span>NON-STOP 24/7/365</span>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="pricing-card glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-light)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--secondary-color)' }} />
                {t('towing.pricing.title')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <strong style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>{t('towing.pricing.flat_label')}</strong>
                  <span style={{ fontSize: '1.15rem', color: 'var(--secondary-color)', fontWeight: 800 }}>{t('towing.pricing.flat_val')}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <strong style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>{t('towing.pricing.km_label')}</strong>
                  <span style={{ fontSize: '1.15rem', color: 'var(--secondary-color)', fontWeight: 800 }}>{t('towing.pricing.km_val')}</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.4rem', margin: 0 }}>
                    {t('towing.pricing.fee')}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-color)', display: 'block', marginTop: '0.75rem', fontWeight: 600 }}>
                {t('towing.pricing.currency_info')}
              </span>
            </div>
          </div>

          {/* Map & Description */}
          <div className="towing-right-col">
            <div className="towing-info-card glass-panel">
              <div className="towing-service-item" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={24} className="check-icon" style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: '1.1rem', color: 'var(--text-light)', fontWeight: 500, lineHeight: 1.4 }}>
                  {t('towing.desc')}
                </span>
              </div>

              {/* Leaflet Map */}
              <div className="map-container-wrapper">
                <div id="emergency-map" style={{ width: '100%', height: '100%', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 2, background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', pointerEvents: 'none' }}>
                  <MapPin size={12} style={{ color: '#ef4444' }} />
                  <span>{t('towing.map.badge')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default TowingServices;
