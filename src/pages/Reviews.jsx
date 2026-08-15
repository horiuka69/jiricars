import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquarePlus, User, CheckCircle2, Trash2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAdmin } from '../context/AdminContext';
import './Reviews.css';

const Reviews = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Seed initial reviews if collection is empty
      if (fetchedReviews.length === 0) {
        const initialReviews = [
          {
            name: "Marek K.",
            rating: 5,
            date: "2026-07-10",
            comment: "Absolutely top-tier import service! Brought my Audi RS6 from Frankfurt to Prague within 48 hours, fully insured. Kept me updated with GPS locations all the way. Recommending JiriCars to all my colleagues!"
          },
          {
            name: "Sofia M.",
            rating: 5,
            date: "2026-07-04",
            comment: "Purchased a Mercedes E63 from their marketplace. The car was in immaculate condition, fully polished, and detailed. Jiri is a true professional."
          },
          {
            name: "David V.",
            rating: 4,
            date: "2026-06-25",
            comment: "Rented the tow truck for transport from Austria. Booking was straightforward on their calendar. Winch worked perfectly, vehicle is very modern. 4/5 because of slightly tight cabin storage, otherwise perfect!"
          }
        ];
        initialReviews.forEach(async (rev) => {
          await addDoc(collection(db, 'reviews'), rev);
        });
      } else {
        setReviewsList(fetchedReviews);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');

    if (name && comment) {
      const newReview = {
        name,
        rating,
        date: new Date().toISOString().split('T')[0],
        comment
      };
      try {
        const writePromise = addDoc(collection(db, 'reviews'), newReview);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase write timeout')), 6000)
        );
        
        await Promise.race([writePromise, timeoutPromise]);

        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setShowSubmitForm(false);
          setName('');
          setComment('');
          setRating(5);
        }, 3000);
      } catch (error) {
        console.error("Error adding review to Firestore: ", error);
        setErrorMessage(t('reviews.error') || 'Error submitting review. Please verify your internet connection or Firebase setup.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Opravdu chcete smazat toto hodnocení? / Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={15} className={i < count ? "star-active" : "star-inactive"} fill={i < count ? "currentColor" : "none"} />
    ));
  };

  // Stats calculation
  const totalReviews = reviewsList.length || 1;
  const averageRating = reviewsList.length > 0 
    ? (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / reviewsList.length).toFixed(1)
    : "5.0";

  // Distribution calculations
  const distribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviewsList.filter(r => r.rating === stars).length;
    const percentage = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
    return { stars, percentage, count };
  });

  return (
    <PageTransition>
      <section className="reviews-page container">
        <div className="reviews-header">
          <h1>{t('reviews.title')}</h1>
          <p>{t('reviews.subtitle')}</p>
        </div>

        {/* Top Section: Overview Stats & Actions */}
        <div className="reviews-stats-row">
          <div className="stats-overall-card glass-panel">
            <h3>{t('reviews.rating.title')}</h3>
            <div className="overall-score-box">
              <span className="overall-number">{averageRating}</span>
              <div className="overall-stars">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="overall-count">{t('reviews.rating.based_on', { count: reviewsList.length })}</span>
            </div>
          </div>

          <div className="stats-distribution-card glass-panel">
            {distribution.map((dist) => (
              <div key={dist.stars} className="dist-row">
                <span className="dist-star-lbl">{dist.stars} <Star size={12} fill="currentColor" /></span>
                <div className="dist-bar-wrapper">
                  <div className="dist-bar-fill" style={{ width: `${dist.percentage}%` }}></div>
                </div>
                <span className="dist-count-lbl">{dist.count}</span>
              </div>
            ))}
          </div>

          <div className="reviews-action-card">
            <button className="btn btn-primary w-full" onClick={() => setShowSubmitForm(!showSubmitForm)}>
              <MessageSquarePlus size={18} /> {t('reviews.form.title')}
            </button>
          </div>
        </div>

        {/* Review Form Drawer */}
        <AnimatePresence>
          {showSubmitForm && (
            <motion.div 
              className="review-submit-drawer glass-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isSubmitted ? (
                <div className="submit-success-box">
                  <CheckCircle2 size={36} className="success-icon" />
                  <h4>{t('reviews.success')}</h4>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="review-form">
                  <h3>{t('reviews.form.title')}</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{t('reviews.form.name')}</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Martin S."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('reviews.form.rating')}</label>
                      <div className="stars-picker">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`star-pick-btn ${s <= rating ? 'active' : ''}`}
                            onClick={() => setRating(s)}
                          >
                            <Star size={24} fill={s <= rating ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('reviews.form.comment')}</label>
                    <textarea 
                      required 
                      rows="4" 
                      placeholder="Share your experience with our services..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                  {errorMessage && (
                    <div className="error-message-box" style={{ color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      {errorMessage}
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? t('reviews.submitting') : t('reviews.form.submit')}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews List */}
        <div className="reviews-list">
          {reviewsList.map((review) => (
            <motion.div 
              key={review.id} 
              className="review-card glass-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="review-card-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    <User size={18} />
                  </div>
                  <div>
                    <h4>{review.name}</h4>
                    <span className="review-date">{review.date}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="review-card-stars">
                    {renderStars(review.rating)}
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteReview(review.id)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: '#ef4444', 
                        cursor: 'pointer', 
                        padding: '6px', 
                        borderRadius: '6px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Smazat / Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
};

export default Reviews;
