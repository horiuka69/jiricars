import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Settings, Calendar, ArrowRight, Gauge, Disc, Plus, Trash2, X, ChevronLeft, ChevronRight, Image as ImageIcon, Upload } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { useAdmin } from '../context/AdminContext';
import './Listings.css';

// Client-side image compression to fit within Firestore's 1MB limit
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 675;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.5 quality to keep size tiny
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Listings = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const [filterBrand, setFilterBrand] = useState('All');
  const [sortByPrice, setSortByPrice] = useState('Default');
  const [carsList, setCarsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Form states
  const [newBrand, setNewBrand] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newMileage, setNewMileage] = useState('');
  const [newTransmission, setNewTransmission] = useState('Automatic');
  const [newFuel, setNewFuel] = useState('Petrol');
  const [newPower, setNewPower] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'listings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCarsList(fetchedCars);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listings subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle local image file selections & compression
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    const compressedUrls = [];
    
    // We allow up to 20 compressed local images to keep firestore doc sizes under 1MB
    const filesToUpload = files.slice(0, 20);

    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const compressed = await compressImage(filesToUpload[i]);
        compressedUrls.push(compressed);
      } catch (err) {
        console.error("Image compression failed:", err);
      }
    }

    setUploadedImages(prev => [...prev, ...compressedUrls]);
    setUploadingFiles(false);
    
    if (files.length > 20) {
      alert("Pro zachování rychlosti webu bylo uloženo prvních 20 snímků. Pro více obrázků doporučujeme použít URL odkazy. / First 20 images saved to prevent performance limits.");
    }
  };

  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice || !newBrand) return;

    // Combine manual URLs & uploaded base64 files
    const parsedUrls = imageUrlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.startsWith('http://') || url.startsWith('https://'));

    const allImages = [...uploadedImages, ...parsedUrls];
    
    // Fallback default image if none provided
    const mainImage = allImages[0] || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop";
    if (allImages.length === 0) {
      allImages.push(mainImage);
    }

    const carData = {
      brand: newBrand.trim(),
      name: newName.trim(),
      price: Number(newPrice),
      year: newYear || "2024",
      mileage: newMileage ? `${Number(newMileage).toLocaleString()} km` : "0 km",
      transmission: newTransmission,
      fuel: newFuel,
      power: newPower ? `${newPower} HP` : "N/A",
      description: description.trim() || "Pro toto vozidlo není k dispozici žádný popis. / No description available for this vehicle.",
      image: mainImage,
      images: allImages
    };

    try {
      await addDoc(collection(db, 'listings'), carData);
      setShowAddForm(false);
      
      // Reset form fields
      setNewBrand('');
      setNewName('');
      setNewPrice('');
      setNewYear('');
      setNewMileage('');
      setNewPower('');
      setDescription('');
      setUploadedImages([]);
      setImageUrlsText('');
    } catch (error) {
      console.error("Error adding listing to Firestore:", error);
      alert("Chyba při nahrávání inzerátu. Zkontrolujte prosím Cloud Firestore Rules ve Firebase konzoli! / Failed to upload. Please check Firebase rules.");
    }
  };

  const handleDeleteListing = async (e, carId) => {
    e.stopPropagation(); // prevent modal trigger
    if (window.confirm("Opravdu chcete smazat tento inzerát? / Are you sure you want to delete this listing?")) {
      try {
        await deleteDoc(doc(db, 'listings', carId));
        if (selectedCar?.id === carId) {
          setSelectedCar(null);
        }
      } catch (error) {
        console.error("Error deleting listing:", error);
      }
    }
  };

  const openCarDetails = (car) => {
    setSelectedCar(car);
    setCarouselIndex(0);
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    if (!selectedCar?.images) return;
    setCarouselIndex(prev => (prev + 1) % selectedCar.images.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    if (!selectedCar?.images) return;
    setCarouselIndex(prev => (prev - 1 + selectedCar.images.length) % selectedCar.images.length);
  };

  // Filtering
  const filteredCars = carsList.filter(car => {
    if (filterBrand === 'All') return true;
    return car.brand?.toLowerCase() === filterBrand?.toLowerCase();
  });

  // Sorting
  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortByPrice === 'LowToHigh') return a.price - b.price;
    if (sortByPrice === 'HighToLow') return b.price - a.price;
    return 0;
  });

  // Dynamically compute brands list from what's currently in database
  const brands = ['All', ...new Set(carsList.map(car => car.brand).filter(Boolean))];

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
                    <label>Značka / Brand (Vygeneruje filtr)</label>
                    <input type="text" required placeholder="e.g. Škoda" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
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

                {/* Images Upload Area */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Nahrát obrázky z počítače / Upload Local Images</label>
                    <div style={{ position: 'relative', minHeight: '110px', border: '2px dashed var(--glass-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploadingFiles}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      {uploadingFiles ? (
                        <span>Optimalizuji a komprimuji snímky... / Processing...</span>
                      ) : (
                        <>
                          <Upload size={24} style={{ color: 'var(--secondary-color)', marginBottom: '0.5rem' }} />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>Vybrat soubory (max 20)</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>JPEG, PNG (budou automaticky komprimovány)</span>
                        </>
                      )}
                    </div>
                    {uploadedImages.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '50px', height: '38px', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ff4d4d', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', cursor: 'pointer' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Nahrát pomocí URL odkazů / Add Images by URL</label>
                    <textarea 
                      rows="4" 
                      placeholder="Vložte URL adresy obrázků (jeden odkaz na řádek)...&#10;https://example.com/foto1.jpg&#10;https://example.com/foto2.jpg" 
                      value={imageUrlsText} 
                      onChange={(e) => setImageUrlsText(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="form-group">
                  <label>Popis vozidla / Car Description</label>
                  <textarea required rows="5" placeholder="Sem vložte podrobné informace o vozidle (stav, výbava, servisní knížka...)" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={uploadingFiles} style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
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
                  className={`brand-tag ${filterBrand.toLowerCase() === brand.toLowerCase() ? 'active' : ''}`}
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
                  onClick={() => openCarDetails(car)}
                  style={{ position: 'relative', cursor: 'pointer' }}
                >
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDeleteListing(e, car.id)}
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
                    {car.images && car.images.length > 1 && (
                      <div className="image-count-badge" style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ImageIcon size={12} />
                        <span>{car.images.length}</span>
                      </div>
                    )}
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
                    <button className="btn btn-primary w-full mt-4" onClick={(e) => { e.stopPropagation(); openCarDetails(car); }}>
                      Zobrazit detaily / View Details <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Detailed Car Modal Popup */}
        <AnimatePresence>
          {selectedCar && (
            <motion.div 
              className="car-detail-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCar(null)}
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(8, 10, 16, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}
            >
              <motion.div 
                className="car-detail-modal glass-panel"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', width: '100%', maxLength: '100%', maxWidth: '850px', background: 'rgba(18, 22, 33, 0.95)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}
              >
                <button className="close-detail-modal-btn" onClick={() => setSelectedCar(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-light)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <X size={20} />
                </button>

                {/* Header Information */}
                <div>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--text-light)', margin: 0 }}>{selectedCar.name}</h2>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--secondary-color)', fontWeight: 'bold', letterSpacing: '1px' }}>{selectedCar.brand}</span>
                </div>

                {/* Sliding Image Carousel */}
                {selectedCar.images && selectedCar.images.length > 0 && (
                  <div className="modal-carousel-container" style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden', background: '#080c10' }}>
                    <img 
                      src={selectedCar.images[carouselIndex]} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />

                    {selectedCar.images.length > 1 && (
                      <>
                        <button className="carousel-control-btn left" onClick={prevSlide} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          <ChevronLeft size={20} />
                        </button>
                        <button className="carousel-control-btn right" onClick={nextSlide} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          <ChevronRight size={20} />
                        </button>

                        <div className="carousel-indicator-badge" style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                          {carouselIndex + 1} / {selectedCar.images.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Specifications grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', width: '100%' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={18} style={{ color: 'var(--secondary-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>Rok / Year</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{selectedCar.year}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={18} style={{ color: 'var(--secondary-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>Nájezd / Km</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{selectedCar.mileage}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Settings size={18} style={{ color: 'var(--secondary-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>Převodovka / Gearbox</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{selectedCar.transmission}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Fuel size={18} style={{ color: 'var(--secondary-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>Palivo / Fuel</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{selectedCar.fuel}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Disc size={18} style={{ color: 'var(--secondary-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>Výkon / Power</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{selectedCar.power}</strong>
                  </div>
                </div>

                {/* Price and Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-light)' }}>Popis vozidla / Vehicle Info</h4>
                    <span style={{ fontSize: '1.4rem', color: 'var(--secondary-color)', fontWeight: 'bold' }}>{Number(selectedCar.price).toLocaleString()} -,-</span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedCar.description}
                  </p>
                </div>

                {/* Inquire CTA */}
                <Link to={`/contact?inquiry=${encodeURIComponent(selectedCar.name)}`} className="btn btn-primary w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', textDecoration: 'none' }}>
                  <span>Mám zájem / Send Inquiry</span>
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  );
};

export default Listings;
