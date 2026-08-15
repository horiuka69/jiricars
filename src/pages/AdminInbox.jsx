import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Inbox, ArrowRight, CornerUpLeft, Clock, CheckCircle2, AlertCircle, RefreshCw, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import './AdminInbox.css';

const AdminInbox = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sent'); // 'sent', 'received', 'compose'
  
  // Sent and received raw logs states
  const [rawEmails, setRawEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Compose form states
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [replyToMessageId, setReplyToMessageId] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  // Selected thread & email details expansion cache
  const [selectedThread, setSelectedThread] = useState(null);
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [emailDetailsCache, setEmailDetailsCache] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  // Redirect if not authorized
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load emails and group them
  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const sentRes = await fetch('/api/list-sent-emails');
      const sentData = await sentRes.json();
      
      const receivedRes = await fetch('/api/list-received-emails');
      const receivedData = await receivedRes.json();
      
      if (sentRes.ok) {
        const rawSentList = (sentData.data || []).map(email => ({ ...email, type: 'sent' }));
        const rawReceivedList = (receivedData.data || []).map(email => ({ ...email, type: 'received' }));
        
        // Combine both log datasets
        setRawEmails([...rawSentList, ...rawReceivedList]);
      } else {
        setError(sentData.error || 'Failed to fetch email logs. Check Vercel key environment variables.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Verify API routes are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEmails();
    }
  }, [isAdmin]);

  // Clean subject to compute thread grouping keys
  const getThreadKey = (email) => {
    if (!email.subject) return 'no-subject';
    return email.subject
      .replace(/^(re|fwd|fw|odpověď):\s*/i, '')
      .trim();
  };

  // Group emails into threads
  const getThreads = () => {
    const threads = {};
    
    rawEmails.forEach(email => {
      const threadSubject = getThreadKey(email);
      
      // Determine the customer's email address
      let contactEmail = '';
      if (email.from && !email.from.includes('easyodtah.cz')) {
        contactEmail = email.from;
      } else if (email.to && email.to.length > 0) {
        contactEmail = email.to.find(r => !r.includes('easyodtah.cz')) || email.to[0];
      }
      
      // Group key matches clean subject + contact email
      const groupKey = `${threadSubject}__${contactEmail}`;
      
      if (!threads[groupKey]) {
        threads[groupKey] = {
          key: groupKey,
          subject: threadSubject,
          contact: contactEmail,
          emails: [],
          lastMessageAt: email.created_at
        };
      }
      
      threads[groupKey].emails.push(email);
      
      if (new Date(email.created_at) > new Date(threads[groupKey].lastMessageAt)) {
        threads[groupKey].lastMessageAt = email.created_at;
      }
    });

    // Sort emails in each thread chronologically (oldest to newest)
    Object.values(threads).forEach(thread => {
      thread.emails.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    // Return threads sorted by last message timestamp desc
    return Object.values(threads).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  };

  // Filter threads by current tab ('sent' or 'received')
  const getFilteredThreads = () => {
    const allThreads = getThreads();
    
    return allThreads.filter(thread => {
      // Find the latest message in the thread
      const latestMessage = thread.emails[thread.emails.length - 1];
      
      // If the latest message goes to easyodtah.cz, classify the thread as "received"
      const isLatestReceived = latestMessage.to && latestMessage.to.some(r => r.includes('easyodtah.cz'));
      
      if (activeTab === 'received') {
        return isLatestReceived;
      } else if (activeTab === 'sent') {
        return !isLatestReceived;
      }
      return true;
    });
  };

  // Client-side search query filtering
  const filterThreadsBySearch = (threadsList) => {
    if (!searchQuery) return threadsList;
    const q = searchQuery.toLowerCase();
    
    return threadsList.filter(thread => {
      const matchesSubject = thread.subject.toLowerCase().includes(q);
      const matchesContact = thread.contact.toLowerCase().includes(q);
      const matchesEmailBodies = thread.emails.some(email => 
        (email.id && email.id.toLowerCase().includes(q)) || 
        (email.from && email.from.toLowerCase().includes(q))
      );
      return matchesSubject || matchesContact || matchesEmailBodies;
    });
  };

  // Load single email body detail cache on-the-fly
  const loadEmailDetails = async (email) => {
    if (emailDetailsCache[email.id]) {
      setExpandedEmailId(expandedEmailId === email.id ? null : email.id);
      return;
    }

    setDetailLoadingId(email.id);
    try {
      const res = await fetch(`/api/get-email?id=${email.id}&type=${email.type || 'sent'}`);
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

  const handleSendCustomEmail = async (e) => {
    e.preventDefault();
    setSendLoading(true);
    setSendSuccess(false);
    setSendError('');

    try {
      const res = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
          replyToMessageId: replyToMessageId
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSendSuccess(true);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setReplyToMessageId('');
        
        // Refresh inbox logs
        fetchEmails();
        
        setTimeout(() => {
          setSendSuccess(false);
          setActiveTab('sent');
        }, 3000);
      } else {
        setSendError(data.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      console.error(err);
      setSendError('Failed to establish contact with mail server.');
    } finally {
      setSendLoading(false);
    }
  };

  // Generate reply and append original quoted message body
  const handleReply = (emailTo, originalMsgId, originalSubject, cachedDetail) => {
    setComposeTo(emailTo);
    
    const cleanSubject = originalSubject.toLowerCase().startsWith('re:') 
      ? originalSubject 
      : `Re: ${originalSubject}`;
    setComposeSubject(cleanSubject);
    setReplyToMessageId(originalMsgId || '');

    // Format previous quoted message history
    let originalQuote = '';
    if (cachedDetail) {
      const dateStr = new Date(cachedDetail.created_at).toLocaleString();
      const fromStr = cachedDetail.from || 'info@easyodtah.cz';
      const toStr = Array.isArray(cachedDetail.to) ? cachedDetail.to.join(', ') : cachedDetail.to;
      const cleanBody = cachedDetail.text || (cachedDetail.html ? cachedDetail.html.replace(/<[^>]*>/g, '') : '');
      
      originalQuote = `\n\n\n----- Původní zpráva / Original Message -----\nOd: ${fromStr}\nDatum: ${dateStr}\nKomu: ${toStr}\nPředmět: ${cachedDetail.subject}\n\n> ` + cleanBody.split('\n').join('\n> ');
    }

    setComposeBody(originalQuote);
    setActiveTab('compose');
  };

  // Safely extract email regex
  const getInquiryCustomerEmail = (email, details) => {
    if (details && details.reply_to && details.reply_to.length > 0) {
      return details.reply_to[0];
    }
    if (details) {
      const content = details.html || details.text || '';
      const emailRegex = /(?:Email:<\/strong>\s*|Email:\s*)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
      const match = content.match(emailRegex);
      if (match) return match[1];
    }
    return email.from && email.from.includes('easyodtah.cz') 
      ? (Array.isArray(email.to) ? email.to[0] : email.to)
      : email.from;
  };

  const filteredThreads = getFilteredThreads();
  const searchedThreads = filterThreadsBySearch(filteredThreads);

  if (!isAdmin) return null;

  return (
    <PageTransition>
      <section className="admin-inbox-page container">
        <div className="inbox-header">
          <h1>Administrátorská schránka / Inbox</h1>
          <p>Přehled konverzací a přímé odpovědi zákazníkům pod doménou easyodtah.cz</p>
        </div>

        {/* Tab Controls */}
        <div className="inbox-tabs">
          <button 
            className={`inbox-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sent'); setSearchQuery(''); }}
          >
            <Send size={16} />
            <span>Odeslané / Sent Logs</span>
          </button>
          
          <button 
            className={`inbox-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => { setActiveTab('received'); setSearchQuery(''); }}
          >
            <Inbox size={16} />
            <span>Doručené / Inbound</span>
          </button>
          
          <button 
            className={`inbox-tab-btn ${activeTab === 'compose' ? 'active' : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            <Mail size={16} />
            <span>Napsat e-mail / Compose</span>
          </button>

          {activeTab !== 'compose' && (
            <button className="inbox-refresh-btn" onClick={fetchEmails} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          )}
        </div>

        {/* Errors & Notifications */}
        {error && (
          <div className="inbox-error-card glass-panel">
            <AlertCircle size={20} />
            <div>
              <strong>Chyba databáze e-mailů / Connection Error</strong>
              <p>{error}</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.25rem', display: 'block' }}>
                Ujistěte se, že máte v nastavení Vercel projektu (Settings &rarr; Environment Variables) nakonfigurovaný platný RESEND_API_KEY.
              </span>
            </div>
          </div>
        )}

        {/* Tab Contents */}
        <div className="inbox-content-wrapper">
          {activeTab === 'compose' ? (
            <div className="compose-panel glass-panel">
              <h3>Nový e-mail / Compose Mail</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                E-mail bude odeslán z vaší ověřené firemní schránky: <strong style={{ color: 'var(--secondary-color)' }}>info@easyodtah.cz</strong>
              </p>

              {sendSuccess && (
                <div className="send-success-notice">
                  <CheckCircle2 size={20} />
                  <span>E-mail byl úspěšně odeslán! / Email sent successfully!</span>
                </div>
              )}

              {sendError && (
                <div className="send-error-notice">
                  <AlertCircle size={20} />
                  <span>{sendError}</span>
                </div>
              )}

              <form onSubmit={handleSendCustomEmail} className="compose-form">
                <div className="form-group">
                  <label>Příjemce / To (Recipient Email)</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="customer@email.cz" 
                    value={composeTo} 
                    onChange={(e) => setComposeTo(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Předmět / Subject</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Nabídka odtahu / Towing Quote" 
                    value={composeSubject} 
                    onChange={(e) => setComposeSubject(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Zpráva / Email Message Body</label>
                  <textarea 
                    required 
                    rows="12" 
                    placeholder="Dobrý den, ohledně vaší poptávky..." 
                    value={composeBody} 
                    onChange={(e) => setComposeBody(e.target.value)}
                    style={{ fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.5' }}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={sendLoading} style={{ alignSelf: 'flex-start', padding: '0.8rem 2.5rem' }}>
                  {sendLoading ? 'Odesílám... / Sending...' : 'Odeslat e-mail / Send Email'}
                </button>
              </form>
            </div>
          ) : (
            // Lists View
            <div className="logs-panel glass-panel">
              {/* Search Bar */}
              <div className="search-bar-container" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-main)' }} />
                <input 
                  type="text" 
                  placeholder="Hledat konverzace... / Search conversations..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem 0.75rem 2.75rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '12px', 
                    color: 'var(--text-light)', 
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }} 
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="logs-loading">
                  <RefreshCw size={24} className="spin" />
                  <span>Načítám konverzace... / Loading conversations...</span>
                </div>
              ) : (
                <div className="email-logs-list">
                  {searchedThreads.length === 0 ? (
                    <div className="empty-logs">
                      Žádné konverzace / No conversations found.
                      {activeTab === 'received' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.75rem', lineHeight: '1.5' }}>
                          Tip: Chcete-li přijímat odpovědi zákazníků přímo zde, musíte mít v Resend nastaveno příchozí směrování (Inbound Routing MX záznamy). Jinak odpovědi chodí do vaší normální schránky.
                        </p>
                      )}
                    </div>
                  ) : (
                    searchedThreads.map((thread) => {
                      const msgCount = thread.emails.length;
                      const latest = thread.emails[msgCount - 1];
                      return (
                        <div key={thread.key} className="email-log-item" onClick={() => { setSelectedThread(thread); setExpandedEmailId(latest.id); }}>
                          <div className="log-main-info">
                            <span className="log-recipient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong>{thread.contact}</strong>
                              {msgCount > 1 && <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--secondary-color)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '8px', fontWeight: 'bold' }}>{msgCount}</span>}
                            </span>
                            <span className="log-subject">{thread.subject}</span>
                          </div>
                          <div className="log-meta-info">
                            <span className={`log-status ${latest.to && latest.to.some(r => r.includes('easyodtah.cz')) ? 'badge-info' : 'badge-success'}`}>
                              {latest.to && latest.to.some(r => r.includes('easyodtah.cz')) ? 'Received' : 'Sent'}
                            </span>
                            <span className="log-date"><Clock size={12} /> {new Date(thread.lastMessageAt).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Thread Details Modal */}
        <AnimatePresence>
          {selectedThread && (
            <div className="email-detail-overlay" onClick={() => setSelectedThread(null)}>
              <div className="email-detail-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <button className="close-detail-modal-btn" onClick={() => setSelectedThread(null)}>
                  <X size={20} />
                </button>
                
                <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-light)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', fontSize: '1.3rem' }}>
                  {selectedThread.subject}
                </h3>
                
                {/* Scrollable Conversation Stack */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem', marginBottom: '1.5rem' }}>
                  {selectedThread.emails.map((email, idx) => {
                    const isExpanded = expandedEmailId === email.id;
                    const isSentByAdmin = !email.to || !email.to.some(r => r.includes('easyodtah.cz'));
                    const cachedDetail = emailDetailsCache[email.id];
                    
                    return (
                      <div 
                        key={email.id} 
                        style={{ 
                          background: isSentByAdmin ? 'rgba(255,255,255,0.01)' : 'rgba(6, 182, 212, 0.03)',
                          border: isExpanded ? '1px solid var(--secondary-color)' : '1px solid var(--glass-border)', 
                          borderRadius: '12px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Collapsed Header Bar */}
                        <div 
                          onClick={() => loadEmailDetails(email)}
                          style={{ 
                            padding: '0.75rem 1rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            background: 'rgba(255,255,255,0.01)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>
                              {isSentByAdmin ? 'Od: info@easyodtah.cz (Vy)' : `Od: ${email.from}`}
                            </span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>
                              Komu: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> {new Date(email.created_at).toLocaleString()}
                            </span>
                            {detailLoadingId === email.id ? (
                              <RefreshCw size={14} className="spin" style={{ color: 'var(--secondary-color)' }} />
                            ) : isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </div>

                        {/* Expanded Body Frame */}
                        {isExpanded && (
                          <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}>
                            {cachedDetail ? (
                              cachedDetail.html ? (
                                <iframe 
                                  srcDoc={cachedDetail.html} 
                                  title={`Email-${email.id}`}
                                  style={{ width: '100%', height: '280px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: '#fff' }}
                                />
                              ) : (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                  {cachedDetail.text || 'Bez obsahu / No content.'}
                                </div>
                              )
                            ) : (
                              <div style={{ color: 'var(--text-main)', fontStyle: 'italic', fontSize: '0.85rem' }}>Nelze načíst text e-mailu / Content unavailable.</div>
                            )}
                            
                            {/* Reply shortcut from this specific email inside the thread */}
                            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => {
                                  const replyTo = getInquiryCustomerEmail(email, cachedDetail);
                                  handleReply(replyTo, email.id, email.subject, cachedDetail);
                                  setSelectedThread(null);
                                }}
                              >
                                <CornerUpLeft size={12} style={{ marginRight: '4px' }} />
                                <span>Odpovědět na tuto zprávu / Reply</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer buttons */}
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      // Reply to the latest message in the thread
                      const latestEmail = selectedThread.emails[selectedThread.emails.length - 1];
                      const cachedDetail = emailDetailsCache[latestEmail.id];
                      const replyTo = getInquiryCustomerEmail(latestEmail, cachedDetail);
                      
                      handleReply(replyTo, latestEmail.id, latestEmail.subject, cachedDetail);
                      setSelectedThread(null);
                    }}
                  >
                    <CornerUpLeft size={16} style={{ marginRight: '6px' }} />
                    <span>Odpovědět na poslední / Reply to Thread</span>
                  </button>
                  
                  <button className="btn" onClick={() => setSelectedThread(null)}>
                    Zavřít / Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  );
};

export default AdminInbox;
