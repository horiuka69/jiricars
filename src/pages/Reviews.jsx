import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquarePlus, User, CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Reviews.css';

const Reviews = () => {
  const { t } = useTranslation();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  // Initial dummy review data
  const [reviewsList, setReviewsList] = useState([
    {
      id: 1,
      name: "Marek K.",
      rating: 5,
      date: "2026-07-10",
      comment: "Absolutely top-tier import service! Brought my Audi RS6 from Frankfurt to Prague within 48 hours, fully insured. Kept me updated with GPS locations all the way. Recommending JiriCars to all my colleagues!"
    },
    {
      id: 2,
      name: "Sofia M.",
      rating: 5,
      date: "2026-07-04",
      comment: "Purchased a Mercedes E63 from their marketplace. The car was in immaculate condition, fully polished, and detailed. Jiri is a true professional."
    },
    {
      id: 3,
      name: "David V.",
      rating: 4,
      date: "2026-06-25",
      comment: "Rented the tow truck for transport from Austria. Booking was straightforward on their calendar. Winch worked perfectly, vehicle is very modern. 4/5 because of slightly tight cabin storage, otherwise perfect!"
    }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && comment) {
      const newReview = {
        id: reviewsList.length + 1,
        name,
        rating,
        date: new Date().toISOString().split('T')[0],
        comment
      };
      setReviewsList([newReview, ...reviewsList]);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setShowSubmitForm(false);
        setName('');
        setComment('');
        setRating(5);
      }, 3000);
    }
  };

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={15} className={i < count ? "star-active" : "star-inactive"} fill={i < count ? "currentColor" : "none"} />
    ));
  };

  // Stats calculation
  const totalReviews = reviewsList.length;
  const averageRating = (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1);

  // Distribution calculations
  const distribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviewsList.filter(r => r.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
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
              <span className="overall-count">Based on {totalReviews} Reviews</span>
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
                  <button type="submit" className="btn btn-primary">
                    {t('reviews.form.submit')}
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
                <div className="review-card-stars">
                  {renderStars(review.rating)}
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
