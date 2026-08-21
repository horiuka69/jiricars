import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { Mail, Send, Inbox, Clock, CheckCircle2, AlertCircle, RefreshCw, X, Search, User, ChevronDown, ChevronUp, CornerUpLeft, Filter, Phone, FileText } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import './AdminInbox.css';

const AdminInbox = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  
  // Real-time Firestore emails state
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('received'); // 'received' (inbox), 'sent' (replied/composed)

  // Selected thread state
  const [selectedThreadKey, setSelectedThreadKey] = useState(null);
  const [expandedEmailId, setExpandedEmailId] = useState(null);

  // Reply editor state
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [emailDetailsCache, setEmailDetailsCache] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  // Compose new email overlay state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMailTo, setNewMailTo] = useState('');
  const [newMailSubject, setNewMailSubject] = useState('');
  const [newMailBody, setNewMailBody] = useState('');

  const chatEndRef = useRef(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Subscribe to Firestore "emails" collection in real-time
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const q = query(collection(db, 'emails'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmails(list);
      setLoading(false);
      setError('');
    }, (err) => {
      console.error(err);
      setError('Nepodařilo se připojit k databázi e-mailů. / Failed to subscribe to email database.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const syncResendHistoryToFirestore = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const sentRes = await fetch('/api/list-sent-emails');
      const sentData = await sentRes.json();
      const rawSentList = sentData.data || [];
      
      const receivedRes = await fetch('/api/list-received-emails');
      const receivedData = await receivedRes.json();
      const rawReceivedList = receivedData.data || [];

      // Get existing messageIds to avoid duplicates
      const existingIds = new Set(emails.map(e => e.messageId));

      // Import sent logs
      for (const email of rawSentList) {
        if (existingIds.has(email.id)) continue;
        
        const customerEmail = extractCustomerEmail(email);
        const isFormNotification = email.to && email.to.some(r => r.includes('easyodtah.cz'));
        
        let formType = 'General';
        const sub = (email.subject || '').toLowerCase();
        if (sub.includes('towing') || sub.includes('odtah')) formType = 'towing';
        else if (sub.includes('rental') || sub.includes('pronájem')) formType = 'rental';
        else if (sub.includes('contact') || sub.includes('kontakt')) formType = 'contact';
        
        await addDoc(collection(db, 'emails'), {
          messageId: email.id,
          from: email.from || 'noreply@easyodtah.cz',
          to: email.to || [],
          replyTo: customerEmail,
          subject: email.subject || '',
          text: email.text || '',
          html: email.html || '',
          createdAt: email.created_at || new Date().toISOString(),
          type: isFormNotification ? 'received' : 'sent',
          resendType: 'sent',
          formType: formType
        });
      }

      // Import received logs
      for (const email of rawReceivedList) {
        if (existingIds.has(email.id)) continue;
        
        await addDoc(collection(db, 'emails'), {
          messageId: email.id,
          from: email.from || '',
          to: email.to || [],
          replyTo: email.from || '',
          subject: email.subject || '',
          text: email.text || '',
          html: email.html || '',
          createdAt: email.created_at || new Date().toISOString(),
          type: 'received',
          resendType: 'received',
          formType: 'custom'
        });
      }
    } catch (err) {
      console.error('Failed to sync Resend history:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Auto trigger sync if Firestore database is empty
  useEffect(() => {
    if (!loading && emails.length === 0 && isAdmin) {
      syncResendHistoryToFirestore();
    }
  }, [loading, emails.length, isAdmin]);

  // Scroll details pane to bottom when selecting thread or message count changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThreadKey]);

  const getFormMessageBody = (text) => {
    if (!text) return 'Bez obsahu / No message content provided.';
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

  // Helper clean subject function to group threads
  const getCleanSubject = (subject) => {
    if (!subject) return 'bez předmětu / no subject';
    return subject
      .replace(/^\[easyodtah\.cz\]\s*/i, '')
      .replace(/^new form submission:\s*/i, '')
      .replace(/^(re|fwd|fw|odpověď):\s*/i, '')
      .trim();
  };

  // Extract customer email from form body or meta parameters
  const extractCustomerEmail = (email) => {
    if (email.replyTo) return email.replyTo;
    
    // Parse from body text
    const bodyContent = email.text || email.html || '';
    const emailRegex = /(?:Email:<\/strong>\s*|Email:\s*)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const match = bodyContent.match(emailRegex);
    if (match) return match[1];

    // Fallback to headers
    if (email.from && !email.from.includes('easyodtah.cz')) {
      return email.from;
    }
    if (email.to && email.to.length > 0) {
      const ext = email.to.find(r => !r.includes('easyodtah.cz'));
      if (ext) return ext;
    }
    return 'info@easyodtah.cz';
  };

  const loadEmailDetails = async (email, forceExpand = false) => {
    // If it's already expanded, collapse it
    if (expandedEmailId === email.id && !forceExpand) {
      setExpandedEmailId(null);
      return;
    }

    // Check if we have actual text/html content
    const hasContent = (email.html && email.html.trim().length > 0) || (email.text && email.text.trim().length > 0);
    if (hasContent) {
      setExpandedEmailId(email.id);
      return;
    }

    // If we already cached it, use the cache
    if (emailDetailsCache[email.id]) {
      setExpandedEmailId(email.id);
      return;
    }

    // Otherwise, fetch it on-demand from Resend using its API endpoint type
    setDetailLoadingId(email.id);
    try {
      const res = await fetch(`/api/get-email?id=${email.messageId || email.id}&type=${email.resendType || 'sent'}`);
      const data = await res.json();
      if (res.ok) {
        setEmailDetailsCache(prev => ({ ...prev, [email.id]: data }));
        setExpandedEmailId(email.id);
      } else {
        console.error("Failed to load email details:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoadingId(null);
    }
  };

  // Group emails list into threads
  const getGroupedThreads = () => {
    const threads = {};

    emails.forEach(email => {
      const cleanSub = getCleanSubject(email.subject);
      const customerEmail = extractCustomerEmail(email);
      const groupKey = `${cleanSub}__${customerEmail}`;

      if (!threads[groupKey]) {
        threads[groupKey] = {
          key: groupKey,
          subject: cleanSub,
          customerEmail: customerEmail,
          emails: [],
          lastMessageAt: email.createdAt,
          formType: 'custom', // Default
          customerName: 'Customer',
          customerPhone: ''
        };
      }

      threads[groupKey].emails.push(email);

      // Extract form details if present
      if (email.formType) {
        threads[groupKey].formType = email.formType.toLowerCase();
      }

      // Try to extract name and phone from form text body
      const bodyContent = email.text || email.html || '';
      if (bodyContent) {
        const nameMatch = bodyContent.match(/(?:Name:<\/strong>\s*|Name:\s*|Jméno:\s*)([^\r\n<]+)/i);
        if (nameMatch) threads[groupKey].customerName = nameMatch[1].trim();

        const phoneMatch = bodyContent.match(/(?:Phone:<\/strong>\s*|Phone:\s*|Telefon:\s*)([^\r\n<]+)/i);
        if (phoneMatch) threads[groupKey].customerPhone = phoneMatch[1].trim();
      }

      // Sync latest message timestamp for order sorting
      if (new Date(email.createdAt) > new Date(threads[groupKey].lastMessageAt)) {
        threads[groupKey].lastMessageAt = email.createdAt;
      }
    });

    // Sort emails in each thread chronologically (oldest at top, newest at bottom)
    Object.values(threads).forEach(thread => {
      thread.emails.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    // Sort threads list by latest message date descending
    return Object.values(threads).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  };

  // Filter threads by tab and form type
  const getFilteredThreads = () => {
    const allThreads = getGroupedThreads();

    return allThreads.filter(thread => {
      const latestEmail = thread.emails[thread.emails.length - 1];
      const isLatestReceived = latestEmail.type === 'received' || (latestEmail.to && latestEmail.to.some(r => r.includes('easyodtah.cz')));

      // 1. Tab Filter
      if (activeTab === 'received') {
        if (!isLatestReceived || thread.formType !== 'custom') return false;
      }
      if (activeTab === 'sent') {
        if (isLatestReceived || thread.formType !== 'custom') return false;
      }
      if (activeTab === 'forms') {
        if (thread.formType === 'custom') return false;
      }



      // 3. Search Bar Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = thread.subject.toLowerCase().includes(q);
        const matchesEmail = thread.customerEmail.toLowerCase().includes(q);
        const matchesName = thread.customerName.toLowerCase().includes(q);
        const matchesPhone = thread.customerPhone.includes(q);
        return matchesSubject || matchesEmail || matchesName || matchesPhone;
      }

      return true;
    });
  };

  const activeThreads = getFilteredThreads();
  const selectedThread = activeThreads.find(t => t.key === selectedThreadKey) || (selectedThreadKey ? getGroupedThreads().find(t => t.key === selectedThreadKey) : null);

  // Set expanded email automatically to the latest email inside thread on first load
  useEffect(() => {
    if (selectedThread && selectedThread.emails.length > 0) {
      const latestEmail = selectedThread.emails[selectedThread.emails.length - 1];
      loadEmailDetails(latestEmail, true);
    }
  }, [selectedThreadKey]);

  // Dispatch custom reply email and auto-update thread
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || sending || !selectedThread) return;

    setSending(true);
    setSendSuccess(false);
    setSendError('');

    const latestEmail = selectedThread.emails[selectedThread.emails.length - 1];

    try {
      const res = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedThread.customerEmail,
          subject: `Re: ${latestEmail.subject}`,
          body: replyBody,
          replyToMessageId: latestEmail.messageId || ''
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSendSuccess(true);
        setReplyBody('');
        setTimeout(() => setSendSuccess(false), 2000);
      } else {
        setSendError(data.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      console.error(err);
      setSendError('Failed to establish contact with mail server.');
    } finally {
      setSending(false);
    }
  };

  // Compose new outbound email
  const handleSendNewMail = async (e) => {
    e.preventDefault();
    if (sending || !newMailTo || !newMailSubject || !newMailBody) return;

    setSending(true);
    setSendSuccess(false);
    setSendError('');

    try {
      const res = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newMailTo,
          subject: newMailSubject,
          body: newMailBody
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSendSuccess(true);
        setNewMailTo('');
        setNewMailSubject('');
        setNewMailBody('');
        setShowComposeModal(false);
        setTimeout(() => setSendSuccess(false), 2000);
      } else {
        setSendError(data.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      console.error(err);
      setSendError('Failed to establish contact with mail server.');
    } finally {
      setSending(false);
    }
  };

  const getFormLabel = (type) => {
    switch (type) {
      case 'towing': return 'Odtah / Towing';
      case 'rental': return 'Pronájem / Rental';
      case 'contact': return 'Kontakt / Contact';
      default: return 'Custom Email';
    }
  };

  const getFormBadgeClass = (type) => {
    switch (type) {
      case 'towing': return 'badge-towing';
      case 'rental': return 'badge-rental';
      case 'contact': return 'badge-contact';
      default: return 'badge-custom';
    }
  };

  return (
    <PageTransition>
      <section className="admin-inbox-page container">
        <div className="inbox-header-row">
          <div>
            <h1>Pošta a Poptávky / Mail Support</h1>
            <p>Gmail styl administrace propojený na Resend a Firestore databázi e-mailů</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" onClick={syncResendHistoryToFirestore} disabled={syncing} style={{ display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={16} className={syncing ? 'spin' : ''} style={{ marginRight: '6px' }} />
              <span>{syncing ? 'Synchronizuji...' : 'Aktualizovat / Sync Resend'}</span>
            </button>
            <button className="btn btn-primary" onClick={() => setShowComposeModal(true)} style={{ display: 'flex', alignItems: 'center' }}>
              <Mail size={16} style={{ marginRight: '6px' }} />
              <span>Napsat e-mail / Compose</span>
            </button>
          </div>
        </div>

        {/* Sync Errors */}
        {error && (
          <div className="inbox-error-card glass-panel" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <div>
              <strong>Chyba synchronizace / Sync Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Messaging Layout */}
        <div className="chat-layout-container">
          
          {/* Left Column: Conversations List */}
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
                  <X size={14} />
                </button>
              )}
            </div>



            {/* Tab Toggles */}
            <div className="sidebar-tabs">
              <button className={`sidebar-tab-btn ${activeTab === 'received' ? 'active' : ''}`} onClick={() => setActiveTab('received')}>
                <Inbox size={14} />
                <span>Doručené / Inbox</span>
              </button>
              <button className={`sidebar-tab-btn ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
                <Send size={14} />
                <span>Odeslané / Sent</span>
              </button>
              <button className={`sidebar-tab-btn ${activeTab === 'forms' ? 'active' : ''}`} onClick={() => setActiveTab('forms')}>
                <FileText size={14} />
                <span>Poptávky / Forms</span>
              </button>
            </div>

            {/* Threads List */}
            <div className="sidebar-list">
              {loading ? (
                <div className="list-status-info">
                  <RefreshCw size={20} className="spin" />
                  <span>Načítám konverzace...</span>
                </div>
              ) : activeThreads.length === 0 ? (
                <div className="list-status-info">
                  <span>Žádné aktivní konverzace / No threads found.</span>
                </div>
              ) : (
                activeThreads.map((thread) => {
                  const isSelected = selectedThreadKey === thread.key;
                  const latestMsg = thread.emails[thread.emails.length - 1];
                  const emailCount = thread.emails.length;
                  
                  return (
                    <div 
                      key={thread.key} 
                      className={`conv-list-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedThreadKey(thread.key)}
                    >
                      <div className="conv-item-top">
                        <span className="conv-name">{thread.customerName}</span>
                        <span className="conv-date">{new Date(thread.lastMessageAt).toLocaleDateString()}</span>
                      </div>
                      <div className="conv-subject-row">
                        <span className="conv-subject">{thread.subject}</span>
                        {emailCount > 1 && <span className="conv-badge">{emailCount}</span>}
                      </div>
                      <div className="conv-item-bottom">
                        <span className="conv-snippet">{latestMsg.text || 'Zpráva bez textu / No plain text'}</span>
                        <span className={`form-badge-pill ${getFormBadgeClass(thread.formType)}`}>
                          {getFormLabel(thread.formType)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Message Thread Details */}
          <div className="chat-feed-container glass-panel">
            {selectedThread ? (
              <>
                {activeTab === 'forms' ? (
                  /* Custom Beautiful Form Submission UI */
                  <div className="form-submission-detail-pane" style={{ flex: 1, overflowY: 'auto', padding: '2rem', textAlign: 'left' }}>
                    
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className={`form-badge-pill ${getFormBadgeClass(selectedThread.formType)}`}>
                            {getFormLabel(selectedThread.formType)}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            ID: {selectedThread.emails[0].messageId || selectedThread.emails[0].id}
                          </span>
                        </div>
                        <h2 style={{ fontSize: '1.75rem', color: 'var(--text-light)', margin: 0 }}>
                          {selectedThread.subject}
                        </h2>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} /> {new Date(selectedThread.emails[0].createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Structured Grid info cards */}
                    <div className="form-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                      <div className="form-info-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                          Celé jméno / Name
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                          <User size={16} style={{ color: 'var(--secondary-color)' }} />
                          {selectedThread.customerName}
                        </div>
                      </div>

                      <div className="form-info-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                          E-mail / Email Address
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={16} style={{ color: 'var(--secondary-color)' }} />
                          <a href={`mailto:${selectedThread.customerEmail}`} style={{ color: 'var(--secondary-color)', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.05rem' }}>
                            {selectedThread.customerEmail}
                          </a>
                        </div>
                      </div>

                      <div className="form-info-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                          Telefon / Phone Number
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={16} style={{ color: 'var(--secondary-color)' }} />
                          {selectedThread.customerPhone ? (
                            <a href={`tel:${selectedThread.customerPhone}`} style={{ color: 'var(--text-light)', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.05rem' }}>
                              {selectedThread.customerPhone}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-main)', fontStyle: 'italic', fontSize: '0.95rem' }}>Neuvedeno / Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customer Message Box */}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 'bold', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Zpráva zákazníka / Customer Message
                      </span>
                      <div style={{ background: 'rgba(0, 0, 0, 0.15)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', minHeight: '120px', whiteSpace: 'pre-wrap', color: 'var(--text-light)', fontSize: '1rem', lineHeight: '1.6' }}>
                        {getFormMessageBody(selectedThread.emails[0].text || emailDetailsCache[selectedThread.emails[0].id]?.text)}
                      </div>
                    </div>

                    {/* Conversation History (Slice original lead out) */}
                    {selectedThread.emails.length > 1 && (
                      <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                        <h4 style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CornerUpLeft size={16} style={{ color: 'var(--secondary-color)' }} />
                          <span>Historie odpovědí / Conversation Replies</span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {selectedThread.emails.slice(1).map((email) => {
                            const isAdminSender = email.type === 'sent';
                            return (
                              <div key={email.id} style={{ borderLeft: `3px solid ${isAdminSender ? 'var(--secondary-color)' : 'var(--text-main)'}`, paddingLeft: '1.25rem', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                                  <strong style={{ color: 'var(--text-light)' }}>
                                    {isAdminSender ? 'Easyodtah Podpora (info@easyodtah.cz)' : email.from}
                                  </strong>
                                  <span>{new Date(email.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px' }}>
                                  {email.text || 'Bez textu / No content'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Chronological Email Thread Layout */
                  <>
                    {/* Thread Header Info Card */}
                    <div className="chat-header-info">
                      <div className="customer-avatar">
                        <User size={20} />
                      </div>
                      <div className="header-meta">
                        <h3>{selectedThread.customerName}</h3>
                        <p style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          <strong>Email:</strong> {selectedThread.customerEmail}
                          {selectedThread.customerPhone && (
                            <>
                              <span style={{ margin: '0 0.5rem' }}>|</span>
                              <strong>Telefon:</strong> {selectedThread.customerPhone}
                            </>
                          )}
                        </p>
                      </div>
                      <span className={`form-badge-pill ${getFormBadgeClass(selectedThread.formType)}`} style={{ marginLeft: 'auto' }}>
                        {getFormLabel(selectedThread.formType)}
                      </span>
                    </div>

                    {/* Messages Log Stack (Gmail Thread style) */}
                    <div className="messages-scroller" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {selectedThread.emails.map((email, idx) => {
                        const isExpanded = expandedEmailId === email.id;
                        const isAdminSender = email.type === 'sent';
                        const cachedDetail = emailDetailsCache[email.id];
                        const displayHtml = cachedDetail?.html || email.html || '';
                        const displayText = cachedDetail?.text || email.text || '';
                        const isFetching = detailLoadingId === email.id;

                        return (
                          <div 
                            key={email.id} 
                            style={{
                              borderBottom: idx < selectedThread.emails.length - 1 ? '1px solid var(--glass-border)' : 'none',
                              paddingBottom: '1.5rem',
                              textAlign: 'left'
                            }}
                          >
                            {/* Clean Header */}
                            <div 
                              onClick={() => loadEmailDetails(email)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                paddingBottom: isExpanded ? '0.75rem' : '0'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="customer-avatar" style={{ width: '32px', height: '32px' }}>
                                  <User size={16} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                  <span style={{ color: 'var(--text-light)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    {isAdminSender ? 'Easyodtah Podpora (info@easyodtah.cz)' : email.from}
                                  </span>
                                  {!isExpanded && (
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                      {displayText ? displayText.substring(0, 80) + '...' : 'Kliknutím rozbalíte / Click to expand'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                  {new Date(email.createdAt).toLocaleString()}
                                </span>
                                {isFetching ? (
                                  <RefreshCw size={14} className="spin" style={{ color: 'var(--secondary-color)' }} />
                                ) : isExpanded ? (
                                  <ChevronUp size={16} style={{ color: 'var(--text-main)' }} />
                                ) : (
                                  <ChevronDown size={16} style={{ color: 'var(--text-main)' }} />
                                )}
                              </div>
                            </div>

                            {/* Expanded Content Body (No borders/background boxes) */}
                            {isExpanded && (
                              <div style={{ padding: '0.5rem 0 0 2.75rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                                  Komu: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                                </div>
                                {displayHtml ? (
                                  <iframe 
                                    srcDoc={displayHtml} 
                                    title={`EmailBody-${email.id}`}
                                    style={{ width: '100%', height: '320px', border: 'none', background: 'transparent' }}
                                  />
                                ) : (
                                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {displayText || 'Bez obsahu / No content'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  </>
                )}

                {/* Reply Form Editor Area */}
                <div className="reply-editor-box" style={{ borderTop: '1px solid var(--glass-border)', padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                  {sendSuccess && (
                    <div className="send-success-notice" style={{ marginBottom: '1rem' }}>
                      <CheckCircle2 size={16} />
                      <span>Odpověď byla úspěšně odeslána a uložena! / Reply sent!</span>
                    </div>
                  )}

                  {sendError && (
                    <div className="send-error-notice" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} />
                      <span>{sendError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        required
                        rows="4"
                        placeholder="Napište rychlou odpověď zákazníkovi... / Type your reply..."
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '10px',
                          color: 'var(--text-light)',
                          padding: '0.8rem 1rem',
                          fontFamily: 'inherit',
                          fontSize: '0.95rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      ></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        Odpovídáte z: <strong style={{ color: 'var(--secondary-color)' }}>info@easyodtah.cz</strong>
                      </span>
                      
                      <button type="submit" className="btn btn-primary" disabled={sending || !replyBody.trim()} style={{ padding: '0.6rem 2rem' }}>
                        {sending ? 'Odesílám...' : (
                          <>
                            <CornerUpLeft size={14} style={{ marginRight: '6px' }} />
                            <span>Odeslat odpověď / Send Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="empty-chat-feed">
                <Mail size={48} style={{ color: 'var(--text-main)', opacity: 0.3, marginBottom: '1rem' }} />
                <h3>Žádná vybraná konverzace</h3>
                <p>Vyberte zprávy nebo poptávku v levém panelu k zobrazení historie.</p>
              </div>
            )}
          </div>
        </div>

        {/* Compose New Email Overlay Modal */}
        <AnimatePresence>
          {showComposeModal && (
            <div className="email-detail-overlay" onClick={() => setShowComposeModal(false)}>
              <div className="email-detail-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <button className="close-detail-modal-btn" onClick={() => setShowComposeModal(false)}>
                  <X size={20} />
                </button>
                
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-light)' }}>Napsat novou zprávu / Compose Email</h3>

                {sendError && (
                  <div className="send-error-notice" style={{ marginBottom: '1.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{sendError}</span>
                  </div>
                )}
                
                <form onSubmit={handleSendNewMail} className="compose-form">
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Příjemce / To</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="customer@email.cz" 
                      value={newMailTo} 
                      onChange={(e) => setNewMailTo(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'var(--text-light)', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Předmět / Subject</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Nabídka odtahu / Towing Quote" 
                      value={newMailSubject} 
                      onChange={(e) => setNewMailSubject(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'var(--text-light)', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Zpráva / Body</label>
                    <textarea 
                      required 
                      rows="8" 
                      placeholder="Dobrý den..." 
                      value={newMailBody} 
                      onChange={(e) => setNewMailBody(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'var(--text-light)', padding: '0.75rem', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={sending} style={{ padding: '0.6rem 2.5rem' }}>
                      {sending ? 'Odesílám...' : 'Odeslat / Send'}
                    </button>
                    <button type="button" className="btn" onClick={() => setShowComposeModal(false)}>Zrušit / Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  );
};

export default AdminInbox;
