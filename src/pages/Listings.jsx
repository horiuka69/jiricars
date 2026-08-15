import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Settings, Calendar, ArrowRight, Gauge, Disc, Plus, Trash2, X, Car } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { useAdmin } from '../context/AdminContext';
import './Listings.css';

const Listings = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const [filterBrand, setFilterBrand] = useState('All');
  const [sortByPrice, setSortByPrice] = useState('Default');
  const [carsList, setCarsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newBrand, setNewBrand] = useState('BMW');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newMileage, setNewMileage] = useState('');
  const [newTransmission, setNewTransmission] = useState('Automatic');
  const [newFuel, setNewFuel] = useState('Petrol');
  const [newPower, setNewPower] = useState('');
  const [newImage, setNewImage] = useState('');

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'listings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Seed initial listings if collection is empty
      if (fetchedCars.length === 0) {
        const initialCars = [
          {
            brand: "BMW",
            name: "BMW M3 Competition",
            price: 1850000,
            year: "2021",
            mileage: "24 000 km",
            transmission: "Automatic",
            fuel: "Petrol",
            power: "510 HP",
            image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop"
          },
          {
            brand: "Audi",
            name: "Audi RS6 Avant",
            price: 2200000,
            year: "2020",
            mileage: "45 000 km",
            transmission: "Automatic",
            fuel: "Petrol",
            power: "600 HP",
            image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=1200&auto=format&fit=crop"
          },
          {
            brand: "Skoda",
            name: "Skoda Superb L&K",
            price: 850000,
            year: "2022",
            mileage: "15 000 km",
            transmission: "Automatic",
            fuel: "Diesel",
            power: "200 HP",
            image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop"
          },
          {
            brand: "Porsche",
            name: "Porsche 911 GT3",
            price: 4950000,
            year: "2022",
            mileage: "8 200 km",
            transmission: "PDK (Auto)",
            fuel: "Petrol",
            power: "510 HP",
            image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop"
          },
          {
            brand: "Mercedes",
            name: "Mercedes-AMG E63 S",
            price: 2100000,
            year: "2019",
            mileage: "58 000 km",
            transmission: "Automatic",
            fuel: "Petrol",
            power: "612 HP",
            image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop"
          }
        ];
        initialCars.forEach(async (car) => {
          await addDoc(collection(db, 'listings'), car);
        });
      } else {
        setCarsList(fetchedCars);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore listings subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    const imgFallback = newImage.trim() || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop";

    const carData = {
      brand: newBrand,
      name: newName,
      price: Number(newPrice),
      year: newYear || "2024",
      mileage: newMileage ? `${Number(newMileage).toLocaleString()} km` : "0 km",
      transmission: newTransmission,
      fuel: newFuel,
      power: newPower ? `${newPower} HP` : "N/A",
      image: imgFallback
    };

    try {
      await addDoc(collection(db, 'listings'), carData);
      setShowAddForm(false);
      // Reset form
      setNewName('');
      setNewPrice('');
      setNewYear('');
      setNewMileage('');
      setNewPower('');
      setNewImage('');
    } catch (error) {
      console.error("Error adding listing to Firestore:", error);
    }
  };

  const handleDeleteListing = async (carId) => {
    if (window.confirm("Opravdu chcete smazat tento inzerát? / Are you sure you want to delete this listing?")) {
      try {
        await deleteDoc(doc(db, 'listings', carId));
      } catch (error) {
        console.error("Error deleting listing:", error);
      }
    }
  };

  // Filtering
  const filteredCars = carsList.filter(car => {
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
        <div className="listings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="market-main-title"
              style={{ margin: 0 }}
            >
              {t('market.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="market-subtitle"
              style={{ margin: '0.5rem 0 0 0' }}
            >
              {t('market.subtitle')}
            </motion.p>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showAddForm ? "Zavřít formulář" : "Přidat inzerát"}</span>
            </button>
          )}
        </div>

        {/* Add Listing Form Drawer */}
        <AnimatePresence>
          {showAddForm && isAdmin && (
            <motion.div
              className="add-listing-drawer glass-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '2rem', padding: '2rem' }}
            >
              <form onSubmit={handleAddListing} className="add-listing-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-light)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>Nový inzerát / Add New Listing</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Značka / Brand</label>
                    <select value={newBrand} onChange={(e) => setNewBrand(e.target.value)}>
                      <option value="BMW">BMW</option>
                      <option value="Audi">Audi</option>
                      <option value="Skoda">Škoda</option>
                      <option value="Mercedes">Mercedes</option>
                      <option value="Porsche">Porsche</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Název vozidla / Model Name</label>
                    <input type="text" required placeholder="e.g. Octavia RS III" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Cena / Price (CZK)</label>
                    <input type="number" required placeholder="e.g. 450000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Rok výroby / Year</label>
                    <input type="text" placeholder="e.g. 2018" value={newYear} onChange={(e) => setNewYear(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Nájezd / Mileage (km)</label>
                    <input type="number" placeholder="e.g. 120000" value={newMileage} onChange={(e) => setNewMileage(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Převodovka / Transmission</label>
                    <select value={newTransmission} onChange={(e) => setNewTransmission(e.target.value)}>
                      <option value="Automatic">Automatická / Automatic</option>
                      <option value="Manual">Manuální / Manual</option>
                      <option value="PDK (Auto)">PDK (Auto)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Palivo / Fuel</label>
                    <select value={newFuel} onChange={(e) => setNewFuel(e.target.value)}>
                      <option value="Petrol">Benzín / Petrol</option>
                      <option value="Diesel">Nafta / Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Elektro / EV</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Výkon / Power (HP)</label>
                    <input type="text" placeholder="e.g. 245" value={newPower} onChange={(e) => setNewPower(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>URL Obrázku / Image URL</label>
                  <input type="text" placeholder="Ponechte prázdné pro výchozí / Leave empty for default template" value={newImage} onChange={(e) => setNewImage(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
                  Odeslat inzerát / Submit Listing
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Loading state */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>Načítám inzeráty / Loading listings...</div>
        ) : (
          /* Cars Grid */
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
                  style={{ position: 'relative' }}
                >
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteListing(car.id)}
                      style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'rgba(239, 68, 68, 0.9)', 
                        border: 'none', 
                        color: '#fff', 
                        padding: '8px', 
                        borderRadius: '50%', 
                        cursor: 'pointer', 
                        zIndex: 10, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease' 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Smazat inzerát / Delete listing"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <div className="car-image-container">
                    <img src={car.image} alt={car.name} className="car-image" loading="lazy" />
                    <div className="car-price">
                      {Number(car.price).toLocaleString()} -,-
                    </div>
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
        )}
      </section>
    </PageTransition>
  );
};

export default Listings;
