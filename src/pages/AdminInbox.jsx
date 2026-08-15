import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Inbox, ArrowRight, CornerUpLeft, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import './AdminInbox.css';

const AdminInbox = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sent'); // 'sent', 'received', 'compose'
  
  // Sent and received logs states
  const [sentEmails, setSentEmails] = useState([]);
  const [receivedEmails, setReceivedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Compose form states
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  // Selected email for detail view modal
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Redirect if not authorized
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load emails
  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = activeTab === 'received' ? '/api/list-received-emails' : '/api/list-sent-emails';
      const res = await fetch(endpoint);
      const data = await res.json();
      
      if (res.ok) {
        // Resend returns { data: [...] }
        const list = data.data || [];
        if (activeTab === 'received') {
          setReceivedEmails(list);
        } else {
          setSentEmails(list);
        }
      } else {
        setError(data.error || 'Failed to fetch email logs. Check Vercel key environment variables.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Verify API routes are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && (activeTab === 'sent' || activeTab === 'received')) {
      fetchEmails();
    }
  }, [activeTab, isAdmin]);

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
          body: composeBody
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSendSuccess(true);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        // Return to sent tab after delay
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

  const handleReply = (emailTo) => {
    setComposeTo(emailTo);
    setComposeSubject('Re: Website Inquiry');
    setActiveTab('compose');
  };

  if (!isAdmin) return null;

  return (
    <PageTransition>
      <section className="admin-inbox-page container">
        <div className="inbox-header">
          <h1>Adminstrátorská schránka / Inbox</h1>
          <p>Přehled odeslaných e-mailů a možnost přímé odpovědi zákazníkům pod doménou easyodtah.cz</p>
        </div>

        {/* Tab Controls */}
        <div className="inbox-tabs">
          <button 
            className={`inbox-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            <Send size={16} />
            <span>Odeslané / Sent Logs</span>
          </button>
          
          <button 
            className={`inbox-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
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

          {(activeTab === 'sent' || activeTab === 'received') && (
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
                  <span>E-mail byl úspěšně odeslán! Přesměrovávám do odeslaných... / Email sent successfully!</span>
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
                    rows="8" 
                    placeholder="Dobrý den, ohledně vaší poptávky..." 
                    value={composeBody} 
                    onChange={(e) => setComposeBody(e.target.value)}
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
              {loading ? (
                <div className="logs-loading">
                  <RefreshCw size={24} className="spin" />
                  <span>Načítám výpis e-mailů... / Loading logs...</span>
                </div>
              ) : (
                <>
                  {activeTab === 'sent' && (
                    <div className="email-logs-list">
                      {sentEmails.length === 0 ? (
                        <div className="empty-logs">Žádné odeslané e-maily / No sent emails found.</div>
                      ) : (
                        sentEmails.map((email) => (
                          <div key={email.id} className="email-log-item" onClick={() => setSelectedEmail(email)}>
                            <div className="log-main-info">
                              <span className="log-recipient"><strong>Komu / To:</strong> {email.to.join(', ')}</span>
                              <span className="log-subject">{email.subject}</span>
                            </div>
                            <div className="log-meta-info">
                              <span className="log-status badge-success">Sent</span>
                              <span className="log-date"><Clock size={12} /> {new Date(email.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'received' && (
                    <div className="email-logs-list">
                      {receivedEmails.length === 0 ? (
                        <div className="empty-logs">
                          Žádné doručené zprávy / No incoming emails found.
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                            Tip: Doručené zprávy se zobrazí pouze v případě, že máte v Resend nastaveno příchozí směrování MX záznamů (Inbound Routing).
                          </p>
                        </div>
                      ) : (
                        receivedEmails.map((email) => (
                          <div key={email.id} className="email-log-item" onClick={() => setSelectedEmail(email)}>
                            <div className="log-main-info">
                              <span className="log-recipient"><strong>Od / From:</strong> {email.from}</span>
                              <span className="log-subject">{email.subject}</span>
                            </div>
                            <div className="log-meta-info">
                              <span className="log-status badge-info">Received</span>
                              <span className="log-date"><Clock size={12} /> {new Date(email.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Email Detail modal */}
        <AnimatePresence>
          {selectedEmail && (
            <div className="email-detail-overlay" onClick={() => setSelectedEmail(null)}>
              <div className="email-detail-card glass-panel" onClick={(e) => e.stopPropagation()}>
                <button className="close-detail-modal-btn" onClick={() => setSelectedEmail(null)}>
                  <X size={20} />
                </button>
                
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-light)' }}>Detail e-mailu</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <span><strong>ID:</strong> {selectedEmail.id}</span>
                  <span><strong>Odesílatel / From:</strong> {selectedEmail.from || 'info@easyodtah.cz'}</span>
                  <span><strong>Příjemce / To:</strong> {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to}</span>
                  <span><strong>Předmět / Subject:</strong> {selectedEmail.subject}</span>
                  <span><strong>Čas / Date:</strong> {new Date(selectedEmail.created_at).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      const replyTo = Array.isArray(selectedEmail.to) ? selectedEmail.to[0] : (selectedEmail.from || '');
                      handleReply(replyTo);
                      setSelectedEmail(null);
                    }}
                  >
                    <CornerUpLeft size={16} style={{ marginRight: '6px' }} />
                    <span>Odpovědět / Reply</span>
                  </button>
                  
                  <button className="btn" onClick={() => setSelectedEmail(null)}>
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
