import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { Phone, Mail, MapPin, Clock, Trash2, ArrowLeft, RefreshCw, Search, User, CheckCircle2, ChevronRight, FileText, BarChart3 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import './AdminInbox.css';

const AdminInbox = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  // Firestore submissions state
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected details state
  const [selectedId, setSelectedId] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'towing', 'rental', 'contact'

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Subscribe to Firestore collection
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const q = query(collection(db, 'emails'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out admin replies from the main submissions list (root items only)
      const rootSubmissions = list.filter(item => {
        const isForm = item.formType && item.formType !== 'custom';
        const isCustomerReceived = item.type === 'received' && !item.inReplyTo;
        return isForm || isCustomerReceived;
      });

      // Sort by creation date descending (newest first)
      rootSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Store all documents in state to look up replies
      setSubmissions(list);
      setLoading(false);
      setError('');
    }, (err) => {
      console.error(err);
      setError('Nepodařilo se načíst data z databáze. / Failed to subscribe to Firestore database.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Extract customer email from form body or attributes
  const extractCustomerEmail = (email) => {
    if (email.replyTo) return email.replyTo;
    
    const bodyContent = email.text || email.html || '';
    const emailRegex = /(?:Email:<\/strong>\s*|Email:\s*)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const match = bodyContent.match(emailRegex);
    if (match) return match[1];

    if (email.from && !email.from.includes('easyodtah.cz')) {
      return email.from;
    }
    return 'info@easyodtah.cz';
  };

  // Parse actual customer message text, removing headers
  const getFormMessageBody = (text) => {
    if (!text) return 'Bez textu / No content provided.';
    const parts = text.split(/(?:Message:|Zpráva:|Message \/ Details:)\s*/i);
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return text
      .replace(/Form Type:[^\r\n]*/gi, '')
      .replace(/Name:[^\r\n]*/gi, '')
      .replace(/Email:[^\r\n]*/gi, '')
      .replace(/Phone:[^\r\n]*/gi, '')
      .trim();
  };

  // Try to parse customer name and phone
  const extractNameAndPhone = (email) => {
    let name = 'Zákazník / Customer';
    let phone = '';

    const bodyContent = email.text || email.html || '';
    if (bodyContent) {
      const nameMatch = bodyContent.match(/(?:Name:<\/strong>\s*|Name:\s*|Jméno:\s*)([^\r\n<]+)/i);
      if (nameMatch) name = nameMatch[1].trim();

      const phoneMatch = bodyContent.match(/(?:Phone:<\/strong>\s*|Phone:\s*|Telefon:\s*)([^\r\n<]+)/i);
      if (phoneMatch) phone = phoneMatch[1].trim();
    }

    if (name === 'Zákazník / Customer' && email.from && !email.from.includes('easyodtah.cz')) {
      name = email.from.split('<')[0].trim();
    }

    return { name, phone };
  };

  // Delete submission handler
  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Opravdu chcete tuto poptávku smazat? / Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'emails', id));
      setSelectedId(null);
    } catch (err) {
      console.error('Failed to delete submission:', err);
      alert('Poptávku se nepodařilo smazat. / Failed to delete submission.');
    }
  };

  // Process and filter submissions
  const getRootSubmissions = () => {
    return submissions.filter(item => {
      const isForm = item.formType && item.formType !== 'custom';
      const isCustomerReceived = item.type === 'received' && !item.inReplyTo;
      return isForm || isCustomerReceived;
    });
  };

  const getFilteredSubmissions = () => {
    const roots = getRootSubmissions();
    roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return roots.filter(item => {
      const { name, phone } = extractNameAndPhone(item);
      const email = extractCustomerEmail(item);
      const subject = item.subject || '';

      // 1. Tab / Category Filter
      if (activeFilter !== 'all') {
        const type = item.formType ? item.formType.toLowerCase() : 'contact';
        if (activeFilter === 'contact' && type !== 'contact' && type !== 'general' && type !== 'custom') return false;
        if (activeFilter === 'towing' && type !== 'towing') return false;
        if (activeFilter === 'rental' && type !== 'rental') return false;
      }

      // 2. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = name.toLowerCase().includes(q);
        const matchesEmail = email.toLowerCase().includes(q);
        const matchesPhone = phone.includes(q);
        const matchesSubject = subject.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesPhone || matchesSubject;
      }

      return true;
    });
  };

  const allRoots = getRootSubmissions();
  const activeSubmissions = getFilteredSubmissions();
  const selectedSubmission = submissions.find(s => s.id === selectedId);

  // Get replies history for selected submission
  const getRepliesForSubmission = (sub) => {
    if (!sub) return [];
    return submissions
      .filter(item => {
        return item.inReplyTo === sub.messageId || 
               (item.references && item.references.includes(sub.messageId));
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  const selectedReplies = getRepliesForSubmission(selectedSubmission);

  // Statistics counters
  const totalCount = allRoots.length;
  const towingCount = allRoots.filter(s => s.formType === 'towing').length;
  const rentalCount = allRoots.filter(s => s.formType === 'rental').length;
  const contactCount = allRoots.filter(s => !s.formType || s.formType === 'contact' || s.formType === 'general' || s.formType === 'custom').length;

  const getFormLabel = (type) => {
    switch (type ? type.toLowerCase() : '') {
      case 'towing': return 'Odtah / Towing';
      case 'rental': return 'Pronájem / Rental';
      default: return 'Kontakt / Contact';
    }
  };

  const getFormBadgeClass = (type) => {
    switch (type ? type.toLowerCase() : '') {
      case 'towing': return 'badge-towing';
      case 'rental': return 'badge-rental';
      default: return 'badge-contact';
    }
  };

  return (
    <PageTransition>
      <section className="admin-inbox-page container">
        
        {/* Header Block */}
        <div className="inbox-header-row">
          <div>
            <h1>Přehled poptávek / Submissions Dashboard</h1>
            <p>Správa nahlášených poptávek odtahu, pronájmu odtahovky a kontaktních formulářů</p>
          </div>
        </div>

        {/* Sync/Error alerts */}
        {error && (
          <div className="inbox-error-card glass-panel" style={{ marginBottom: '1.5rem' }}>
            <div>
              <strong>Chyba databáze / Database Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Statistics Summary Cards */}
        <div className="dashboard-stats-grid">
          <div className="stat-card glass-panel" onClick={() => setActiveFilter('all')} style={{ borderLeft: activeFilter === 'all' ? '4px solid var(--secondary-color)' : '1px solid var(--glass-border)' }}>
            <BarChart3 size={20} className="stat-icon" />
            <div>
              <h3>{totalCount}</h3>
              <p>Všechny poptávky / Total</p>
            </div>
          </div>
          <div className="stat-card glass-panel" onClick={() => setActiveFilter('towing')} style={{ borderLeft: activeFilter === 'towing' ? '4px solid #ef4444' : '1px solid var(--glass-border)' }}>
            <FileText size={20} className="stat-icon text-towing" />
            <div>
              <h3>{towingCount}</h3>
              <p>Odtahy / Towing Requests</p>
            </div>
          </div>
          <div className="stat-card glass-panel" onClick={() => setActiveFilter('rental')} style={{ borderLeft: activeFilter === 'rental' ? '4px solid #f59e0b' : '1px solid var(--glass-border)' }}>
            <FileText size={20} className="stat-icon text-rental" />
            <div>
              <h3>{rentalCount}</h3>
              <p>Pronájmy / Rental Inquiries</p>
            </div>
          </div>
          <div className="stat-card glass-panel" onClick={() => setActiveFilter('contact')} style={{ borderLeft: activeFilter === 'contact' ? '4px solid #10b981' : '1px solid var(--glass-border)' }}>
            <Mail size={20} className="stat-icon text-contact" />
            <div>
              <h3>{contactCount}</h3>
              <p>Zprávy / Contact Messages</p>
            </div>
          </div>
        </div>

        {/* Master Detail Split layout */}
        <div className={`chat-layout-container ${selectedId ? 'has-selected-item' : ''}`}>
          
          {/* Left Column: Submissions Sidebar */}
          <div className="conv-sidebar glass-panel">
            
            {/* Search Input */}
            <div className="sidebar-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Hledat jméno, předmět, telefon..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <ArrowLeft size={14} />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="sidebar-filters" style={{ borderBottom: '1px solid var(--glass-border)', padding: '0.5rem 1rem', display: 'flex', gap: '0.4rem' }}>
              <button className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>Vše / All</button>
              <button className={`filter-pill ${activeFilter === 'towing' ? 'active' : ''}`} onClick={() => setActiveFilter('towing')}>Odtah</button>
              <button className={`filter-pill ${activeFilter === 'rental' ? 'active' : ''}`} onClick={() => setActiveFilter('rental')}>Pronájem</button>
              <button className={`filter-pill ${activeFilter === 'contact' ? 'active' : ''}`} onClick={() => setActiveFilter('contact')}>Zprávy</button>
            </div>

            {/* Submissions List */}
            <div className="sidebar-list">
              {loading ? (
                <div className="list-status-info">
                  <RefreshCw size={20} className="spin" />
                  <span>Načítám poptávky...</span>
                </div>
              ) : activeSubmissions.length === 0 ? (
                <div className="list-status-info">
                  <span>Žádné záznamy nenalezeny / No records found.</span>
                </div>
              ) : (
                activeSubmissions.map((sub) => {
                  const isSelected = selectedId === sub.id;
                  const { name, phone } = extractNameAndPhone(sub);
                  const msgPreview = getFormMessageBody(sub.text || emailDetailsCache[sub.id]?.text);

                  return (
                    <div 
                      key={sub.id} 
                      className={`conv-list-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedId(sub.id)}
                    >
                      <div className="conv-item-top">
                        <span className="conv-name">{name}</span>
                        <span className="conv-date">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="conv-subject-row">
                        <span className="conv-subject">{sub.subject || 'Bez předmětu / No subject'}</span>
                      </div>
                      <div className="conv-item-bottom">
                        <span className="conv-snippet">{msgPreview}</span>
                        <span className={`form-badge-pill ${getFormBadgeClass(sub.formType)}`}>
                          {getFormLabel(sub.formType)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed Pane */}
          <div className="chat-feed-container glass-panel">
            {selectedSubmission ? (
              <div className="form-submission-detail-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Header view with back link and delete option */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)' }}>
                  
                  {/* Mobile Back button */}
                  <button className="mobile-back-btn btn" onClick={() => setSelectedId(null)} style={{ display: 'none', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                    <ArrowLeft size={16} />
                    <span>Zpět / Back</span>
                  </button>

                  <div className="desktop-header-title">
                    <span className={`form-badge-pill ${getFormBadgeClass(selectedSubmission.formType)}`} style={{ marginRight: '0.75rem' }}>
                      {getFormLabel(selectedSubmission.formType)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      Doručeno: {new Date(selectedSubmission.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button className="btn" onClick={() => handleDeleteSubmission(selectedSubmission.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                    <Trash2 size={16} />
                    <span>Smazat / Delete</span>
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
                  
                  {/* Subject line header */}
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-light)', marginTop: 0, marginBottom: '1.5rem', textAlign: 'left' }}>
                    {selectedSubmission.subject || 'Bez předmětu / No subject'}
                  </h2>

                  {/* Customer Info Grid */}
                  <div className="form-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    
                    {/* Name Card */}
                    <div className="form-info-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                        Jméno zákazníka / Name
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                        <User size={16} style={{ color: 'var(--secondary-color)' }} />
                        {extractNameAndPhone(selectedSubmission).name}
                      </div>
                    </div>

                    {/* Email Card */}
                    <div className="form-info-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                        E-mail / Email Address
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} style={{ color: 'var(--secondary-color)' }} />
                        <a href={`mailto:${extractCustomerEmail(selectedSubmission)}`} style={{ color: 'var(--secondary-color)', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.05rem' }}>
                          {extractCustomerEmail(selectedSubmission)}
                        </a>
                      </div>
                    </div>

                    {/* Phone Card */}
                    <div className="form-info-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                        Telefon / Phone Number
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={16} style={{ color: 'var(--secondary-color)' }} />
                        {extractNameAndPhone(selectedSubmission).phone ? (
                          <a href={`tel:${extractNameAndPhone(selectedSubmission).phone}`} style={{ color: 'var(--text-light)', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.05rem' }}>
                            {extractNameAndPhone(selectedSubmission).phone}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-main)', fontStyle: 'italic', fontSize: '0.95rem' }}>Neuvedeno / Not provided</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission details block */}
                  <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 'bold', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Obsah zprávy / Customer Message
                    </span>
                    <div style={{ background: 'rgba(0, 0, 0, 0.15)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', minHeight: '150px', whiteSpace: 'pre-wrap', color: 'var(--text-light)', fontSize: '1rem', lineHeight: '1.6' }}>
                      {getFormMessageBody(selectedSubmission.text)}
                    </div>
                  </div>

                  {/* Native Reply actions bar */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', justifyContent: 'flex-start' }}>
                    <a href={`mailto:${extractCustomerEmail(selectedSubmission)}?subject=Re: ${selectedSubmission.subject || 'easyodtah.cz inquiry'}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={16} />
                      <span>Odpovědět e-mailem / Reply via Email</span>
                    </a>
                    {extractNameAndPhone(selectedSubmission).phone && (
                      <a href={`tel:${extractNameAndPhone(selectedSubmission).phone}`} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={16} />
                        <span>Zavolat zákazníkovi / Call Client</span>
                      </a>
                    )}
                  </div>

                  {/* Timeline History block if replies were previously cataloged in DB */}
                  {selectedReplies.length > 0 && (
                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', textAlign: 'left' }}>
                      <h4 style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} style={{ color: 'var(--secondary-color)' }} />
                        <span>Dřívější e-mailové odpovědi / Logged email replies</span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {selectedReplies.map((reply) => {
                          const isAdminSender = reply.type === 'sent';
                          return (
                            <div key={reply.id} style={{ borderLeft: `3px solid ${isAdminSender ? 'var(--secondary-color)' : 'var(--text-main)'}`, paddingLeft: '1.25rem', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                                <strong style={{ color: 'var(--text-light)' }}>
                                  {isAdminSender ? 'Easyodtah Podpora (info@easyodtah.cz)' : reply.from}
                                </strong>
                                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px' }}>
                                {reply.text || 'Bez textu / No content'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="empty-chat-feed">
                <FileText size={48} style={{ color: 'var(--text-main)', opacity: 0.3, marginBottom: '1rem' }} />
                <h3>Žádná vybraná poptávka / No selection</h3>
                <p>Kliknutím na záznam v levém sloupci zobrazíte jeho podrobnosti.</p>
              </div>
            )}
          </div>

        </div>
      </section>
    </PageTransition>
  );
};

// Global cache fallback helper
const emailDetailsCache = {};

export default AdminInbox;
