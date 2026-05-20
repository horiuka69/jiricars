import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Fuel, Settings, Calendar, ArrowRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import jiriMechanic from '../assets/jirimechanic.png';
import './Listings.css';

const Listings = () => {
  const { t } = useTranslation();

  const cars = [
    {
      id: 1,
      name: "BMW M3 Competition",
      price: "1 850 000 CZK",
      year: "2021",
      mileage: "24 000 km",
      transmission: "Automatic",
      fuel: "Petrol",
      image: "https://cdn.motor1.com/images/mgl/1ZQrxK/s1/2023-bmw-m3-cs-first-drive-review.webp"
    },
    {
      id: 2,
      name: "Audi RS6 Avant",
      price: "2 200 000 CZK",
      year: "2020",
      mileage: "45 000 km",
      transmission: "Automatic",
      fuel: "Petrol",
      image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: 3,
      name: "Skoda Superb L&K",
      price: "850 000 CZK",
      year: "2022",
      mileage: "15 000 km",
      transmission: "Automatic",
      fuel: "Diesel",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2000&auto=format&fit=crop"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <PageTransition>
      <section className="listings-page container">
        <div className="listings-header">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t('listings.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t('listings.subtitle')}
          </motion.p>
        </div>

        <motion.div
          className="car-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {cars.map((car) => (
            <motion.div key={car.id} className="car-card glass-panel" variants={cardVariants}>
              <div className="car-image-container">
                <img src={car.image} alt={car.name} className="car-image" />
                <div className="car-price">{car.price}</div>
              </div>
              <div className="car-info">
                <h3>{car.name}</h3>
                <div className="car-specs">
                  <div className="spec-item">
                    <Calendar size={16} /> {car.year} • {car.mileage}
                  </div>
                  <div className="spec-item">
                    <Settings size={16} /> {car.transmission}
                  </div>
                  <div className="spec-item">
                    <Fuel size={16} /> {car.fuel}
                  </div>
                </div>
                <button className="btn btn-primary w-full mt-4">
                  {t('listings.btn')} <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </PageTransition>
  );
};

export default Listings;
