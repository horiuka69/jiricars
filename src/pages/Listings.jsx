import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Settings, Calendar, ArrowRight, Gauge, Disc } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Listings.css';

const Listings = () => {
  const { t } = useTranslation();
  const [filterBrand, setFilterBrand] = useState('All');
  const [sortByPrice, setSortByPrice] = useState('Default');

  const cars = [
    {
      id: 1,
      brand: "BMW",
      name: "BMW M3 Competition",
      price: 1850000,
      priceStr: "1 850 000 CZK",
      year: "2021",
      mileage: "24 000 km",
      transmission: "Automatic",
      fuel: "Petrol",
      power: "510 HP",
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 2,
      brand: "Audi",
      name: "Audi RS6 Avant",
      price: 2200000,
      priceStr: "2 200 000 CZK",
      year: "2020",
      mileage: "45 000 km",
      transmission: "Automatic",
      fuel: "Petrol",
      power: "600 HP",
      image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 3,
      brand: "Skoda",
      name: "Skoda Superb L&K",
      price: 850000,
      priceStr: "850 000 CZK",
      year: "2022",
      mileage: "15 000 km",
      transmission: "Automatic",
      fuel: "Diesel",
      power: "200 HP",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 4,
      brand: "Porsche",
      name: "Porsche 911 GT3",
      price: 4950000,
      priceStr: "4 950 000 CZK",
      year: "2022",
      mileage: "8 200 km",
      transmission: "PDK (Auto)",
      fuel: "Petrol",
      power: "510 HP",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 5,
      brand: "Mercedes",
      name: "Mercedes-AMG E63 S",
      price: 2100000,
      priceStr: "2 100 000 CZK",
      year: "2019",
      mileage: "58 000 km",
      transmission: "Automatic",
      fuel: "Petrol",
      power: "612 HP",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  // Filtering
  const filteredCars = cars.filter(car => {
    if (filterBrand === 'All') return true;
    return car.brand === filterBrand;
  });

  // Sorting
  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortByPrice === 'LowToHigh') return a.price - b.price;
    if (sortByPrice === 'HighToLow') return b.price - a.price;
    return 0;
  });

  const brands = ['All', 'BMW', 'Audi', 'Skoda', 'Mercedes', 'Porsche'];

  return (
    <PageTransition>
      <section className="listings-page container">
        <div className="listings-header">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="market-main-title"
          >
            {t('market.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="market-subtitle"
          >
            {t('market.subtitle')}
          </motion.p>
        </div>

        {/* Filters Panel */}
        <div className="filters-container glass-panel">
          <div className="filter-group">
            <span className="filter-label">Brand:</span>
            <div className="brand-tags">
              {brands.map(brand => (
                <button
                  key={brand}
                  className={`brand-tag ${filterBrand === brand ? 'active' : ''}`}
                  onClick={() => setFilterBrand(brand)}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-group">
            <span className="filter-label">{t('market.filter.price')}:</span>
            <select
              value={sortByPrice}
              onChange={(e) => setSortByPrice(e.target.value)}
              className="sort-select"
            >
              <option value="Default">Featured</option>
              <option value="LowToHigh">{t('market.price.low')}</option>
              <option value="HighToLow">{t('market.price.high')}</option>
            </select>
          </div>
        </div>

        {/* Cars Grid */}
        <motion.div
          className="car-grid"
          layout
        >
          <AnimatePresence mode="popLayout">
            {sortedCars.map((car) => (
              <motion.div
                key={car.id}
                className="car-card glass-panel"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -6 }}
              >
                <div className="car-image-container">
                  <img src={car.image} alt={car.name} className="car-image" loading="lazy" />
                  <div className="car-price">{car.priceStr}</div>
                </div>
                <div className="car-info">
                  <h3>{car.name}</h3>
                  <div className="car-specs">
                    <div className="spec-item">
                      <Calendar size={15} />
                      <span>{car.year}</span>
                    </div>
                    <div className="spec-item">
                      <Gauge size={15} />
                      <span>{car.mileage}</span>
                    </div>
                    <div className="spec-item">
                      <Settings size={15} />
                      <span>{car.transmission}</span>
                    </div>
                    <div className="spec-item">
                      <Fuel size={15} />
                      <span>{car.fuel}</span>
                    </div>
                    <div className="spec-item">
                      <Disc size={15} />
                      <span>{car.power}</span>
                    </div>
                  </div>
                  <a href={`/contact?inquiry=${encodeURIComponent(car.name)}`} className="btn btn-primary w-full mt-4">
                    {t('market.card.inquire')} <ArrowRight size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </PageTransition>
  );
};

export default Listings;
