import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Shield, Cpu, Fuel, Award, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import towTruckImg from '../assets/tow_truck_rental.png';
import './Rental.css';

const Rental = () => {
  const { t } = useTranslation();
  
  // Navigation states
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Date range states
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Set of booked dates in YYYY-MM-DD format
  const bookedDates = new Set([
    "2026-07-22", "2026-07-23", 
    "2026-07-28", "2026-08-04", 
    "2026-08-05", "2026-08-19",
    "2026-08-20", "2026-09-02",
    "2026-09-03"
  ]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // start on Monday

  const days = [];
  // Fill offset days
  for (let i = 0; i < startOffset; i++) {
    days.push({ dateStr: null, dayNum: null, status: 'empty' });
  }

  // Current today reference
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fill actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast = thisDate < today;
    const isBooked = bookedDates.has(dateStr);

    days.push({
      dateStr,
      dayNum: d,
      dateObj: thisDate,
      status: isBooked || isPast ? 'booked' : 'free',
      isPast
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (dayObj) => {
    if (dayObj.status === 'booked' || dayObj.isPast) return;

    const clickedDate = dayObj.dateObj;

    // Reset range or set start
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clickedDate);
      setRangeEnd(null);
      setBookingSuccess(false);
    } else if (rangeStart && !rangeEnd) {
      if (clickedDate < rangeStart) {
        setRangeStart(clickedDate);
      } else {
        // Check if there are any booked dates in the range
        let hasConflict = false;
        let temp = new Date(rangeStart);
        while (temp <= clickedDate) {
          const checkStr = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`;
          if (bookedDates.has(checkStr)) {
            hasConflict = true;
            break;
          }
          temp.setDate(temp.getDate() + 1);
        }

        if (hasConflict) {
          // Restart range with new date
          setRangeStart(clickedDate);
        } else {
          setRangeEnd(clickedDate);
        }
      }
    }
  };

  const isDateSelected = (dateObj) => {
    if (!dateObj) return false;
    if (rangeStart && dateObj.getTime() === rangeStart.getTime()) return true;
    if (rangeEnd && dateObj.getTime() === rangeEnd.getTime()) return true;
    if (rangeStart && rangeEnd && dateObj > rangeStart && dateObj < rangeEnd) return true;
    return false;
  };

  const getSelectedDurationDays = () => {
    if (!rangeStart) return 0;
    if (!rangeEnd) return 1;
    const diffTime = Math.abs(rangeEnd - rangeStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleBookingRequest = () => {
    if (rangeStart) {
      setBookingSuccess(true);
      setTimeout(() => {
        setRangeStart(null);
        setRangeEnd(null);
        setBookingSuccess(false);
      }, 5000);
    }
  };

  const formatDateLabel = (dateObj) => {
    if (!dateObj) return '';
    return `${dateObj.getDate()}. ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  };

  return (
    <PageTransition>
      <section className="rental-page container">
        <div className="rental-header">
          <h1>{t('rental.title')}</h1>
          <p>{t('rental.subtitle')}</p>
        </div>

        <div className="rental-layout">
          {/* Left: Specs & Image */}
          <div className="rental-details">
            <div className="tow-truck-preview glass-panel">
              <img src={towTruckImg} alt="easyodtah.cz Premium Tow Truck" className="tow-image" />
              <div className="image-badge">easyodtah.cz</div>
            </div>

            <div className="specs-card glass-panel">
              <h3>{t('rental.specs.title')}</h3>
              <div className="specs-grid">
                <div className="spec-tile">
                  <Shield size={20} className="spec-icon" />
                  <div>
                    <strong>Payload Capacity</strong>
                    <span>{t('rental.specs.payload')}</span>
                  </div>
                </div>
                <div className="spec-tile">
                  <Cpu size={20} className="spec-icon" />
                  <div>
                    <strong>Winch Power</strong>
                    <span>{t('rental.specs.winch')}</span>
                  </div>
                </div>
                <div className="spec-tile">
                  <Award size={20} className="spec-icon" />
                  <div>
                    <strong>License Required</strong>
                    <span>{t('rental.specs.license')}</span>
                  </div>
                </div>
                <div className="spec-tile">
                  <Fuel size={20} className="spec-icon" />
                  <div>
                    <strong>Engine / Fuel</strong>
                    <span>{t('rental.specs.fuel')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Calendar Availability */}
          <div className="rental-booking">
            <div className="calendar-card glass-panel">
              <div className="calendar-header">
                <CalendarIcon size={22} className="cal-icon" />
                <h3>{t('rental.calendar.title')}</h3>
              </div>
              <p className="calendar-sub">{t('rental.calendar.subtitle')}</p>
              
              <div className="month-navigation">
                <button className="month-nav-btn" onClick={handlePrevMonth}>
                  <ChevronLeft size={20} />
                </button>
                <div className="current-month-display">
                  {monthNames[month]} {year}
                </div>
                <button className="month-nav-btn" onClick={handleNextMonth}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-grid">
                {/* Weekday headers */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, i) => (
                  <div key={i} className="weekday-header">{wd}</div>
                ))}
                
                {/* Days */}
                {days.map((dayObj, index) => {
                  if (dayObj.status === 'empty') {
                    return <div key={index} className="calendar-day empty"></div>;
                  }

                  const isSelected = isDateSelected(dayObj.dateObj);
                  const isStart = rangeStart && dayObj.dateObj.getTime() === rangeStart.getTime();
                  const isEnd = rangeEnd && dayObj.dateObj.getTime() === rangeEnd.getTime();
                  
                  return (
                    <div
                      key={index}
                      className={`calendar-day ${dayObj.status} ${isSelected ? 'selected' : ''} ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''}`}
                      onClick={() => handleDateClick(dayObj)}
                    >
                      {dayObj.dayNum}
                    </div>
                  );
                })}
              </div>

              {/* Selection info and action */}
              <div className="booking-action-area">
                <AnimatePresence mode="wait">
                  {bookingSuccess ? (
                    <motion.div 
                      className="rental-success-msg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <p>{t('rental.success')}</p>
                    </motion.div>
                  ) : rangeStart ? (
                    <motion.div 
                      className="selection-confirm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <p>
                        Selected Dates: <br />
                        <strong>{formatDateLabel(rangeStart)}</strong> 
                        {rangeEnd && <> to <strong>{formatDateLabel(rangeEnd)}</strong></>}
                      </p>
                      <p className="duration-label">
                        Total Rental Duration: <strong>{getSelectedDurationDays()} {getSelectedDurationDays() === 1 ? 'day' : 'days'}</strong>
                      </p>
                      <button className="btn btn-primary w-full mt-3" onClick={handleBookingRequest}>
                        {t('rental.btn.book')}
                      </button>
                    </motion.div>
                  ) : (
                    <div className="no-selection-msg">
                      <HelpCircle size={20} />
                      <p>Select free dates (green tiles) to set your rental range.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Rental;
