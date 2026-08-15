import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, query } from 'firebase/firestore';
import { Mail, Send, Inbox, Clock, CheckCircle2, AlertCircle, RefreshCw, X, Search, User, ShieldAlert, Phone } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAdmin } from '../context/AdminContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminInbox.css';

const AdminInbox = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Real-time Firestore conversations list
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected conversation
  const [selectedConv, setSelectedConv] = useState(null);
  
  // Reply text input
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  
  const chatFeedEndRef = useRef(null);

  // Redirect if not authorized
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Subscribe to real-time conversations list
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const q = query(collection(db, 'conversations'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort conversations by lastMessageAt descending
      list.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      
      setConversations(list);
      setLoading(false);
      setError('');
    }, (err) => {
      console.error(err);
      setError('Nepodařilo se načíst konverzace z databáze Firestore. / Failed to subscribe to database.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Auto scroll chat to bottom when conversation or message list changes
  useEffect(() => {
    chatFeedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  // Sync selected conversation object when active list updates
  useEffect(() => {
    if (selectedConv && conversations.length > 0) {
      const updated = conversations.find(c => c.id === selectedConv.id);
      if (updated) {
        setSelectedConv(updated);
      }
    }
  }, [conversations]);

  // Auto-select conversation matching URL thread query parameter (?thread=ID)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get('thread');
    if (threadId && conversations.length > 0) {
      const matched = conversations.find(c => c.id === threadId);
      if (matched) {
        setSelectedConv(matched);
      }
    }
  }, [conversations, location]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending || !selectedConv) return;

    setSending(true);
    setSendSuccess(false);
    setSendError('');
    
    const messageId = Math.random().toString(36).substring(2, 9);
    const timeNow = new Date().toISOString();
    
    const messagePayload = {
      id: messageId,
      sender: 'admin',
      senderName: 'easyodtah.cz Podpora',
      senderEmail: 'info@easyodtah.cz',
      body: replyText,
      timestamp: timeNow
    };

    try {
      // 1. Write reply to Firestore document
      const docRef = doc(db, 'conversations', selectedConv.id);
      await updateDoc(docRef, {
        messages: arrayUnion(messagePayload),
        lastMessageAt: timeNow
      });

      // Keep reference to sent text before clearing it for the email
      const sentContent = replyText;
      setReplyText('');

      // 2. Dispatch email to customer
      const res = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConv.customerEmail,
          subject: `Odpověď: ${selectedConv.subject}`,
          body: sentContent,
          conversationId: selectedConv.id // Include conversation link inside customer's email
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 2000);
      } else {
        console.error("Email notify fail:", data.error);
        setSendError('Zpráva uložena na chatu, ale e-mailové oznámení nebylo doručeno.');
      }
    } catch (err) {
      console.error(err);
      setSendError('Zpráva se uložila, ale nepodařilo se kontaktovat e-mailový server.');
    } finally {
      setSending(false);
    }
  };

  // Helper search filter
  const getFilteredConversations = () => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.customerName.toLowerCase().includes(q) ||
      c.customerEmail.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  };

  if (!isAdmin) return null;

  return (
    <PageTransition>
      <section className="admin-inbox-page container">
        <div className="inbox-header-row">
          <h1>Zprávy a Poptávky / Support Hub</h1>
          <p>Real-time chatová komunikace se zákazníky a automatická zrcadlová e-mailová upozornění</p>
        </div>

        {/* Connection Errors */}
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
            <div className="sidebar-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Hledat zákazníka, poptávku... / Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sidebar-list">
              {loading ? (
                <div className="list-status-info">
                  <RefreshCw size={20} className="spin" />
                  <span>Načítám zprávy...</span>
                </div>
              ) : getFilteredConversations().length === 0 ? (
                <div className="list-status-info">
                  <span>Žádné aktivní konverzace / No threads found.</span>
                </div>
              ) : (
                getFilteredConversations().map((c) => {
                  const isSelected = selectedConv && selectedConv.id === c.id;
                  const latestMsg = c.messages[c.messages.length - 1];
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`conv-list-item ${isSelected ? 'active' : ''}`}
                      onClick={() => { setSelectedConv(c); setSendError(''); }}
                    >
                      <div className="conv-item-meta">
                        <span className="customer-name">{c.customerName}</span>
                        <span className="msg-date">
                          {new Date(c.lastMessageAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="conv-subject">{c.subject}</span>
                      <p className="latest-msg-preview">
                        {latestMsg ? latestMsg.body : 'Bez zpráv'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Screen */}
          <div className="chat-feed-view glass-panel">
            {selectedConv ? (
              <div className="active-chat-wrapper">
                {/* Active Chat Header */}
                <div className="active-chat-header">
                  <div className="client-profile">
                    <User size={20} className="profile-icon" />
                    <div>
                      <h3>{selectedConv.customerName}</h3>
                      <span className="client-email">{selectedConv.customerEmail}</span>
                      {selectedConv.phone && (
                        <span className="client-phone"><Phone size={11} /> {selectedConv.phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="chat-subject-badge">
                    <span>{selectedConv.subject}</span>
                  </div>
                </div>

                {/* Real-time Message Feed */}
                <div className="feed-messages-viewport">
                  <div className="chat-start-badge">
                    <Clock size={12} /> Založeno: {new Date(selectedConv.messages[0].timestamp).toLocaleString()}
                  </div>

                  {selectedConv.messages.map((msg, index) => {
                    const isAdminMsg = msg.sender === 'admin';
                    return (
                      <div key={msg.id || index} className={`feed-bubble-row ${isAdminMsg ? 'admin-row' : 'customer-row'}`}>
                        <div className={`feed-bubble ${isAdminMsg ? 'admin-bubble' : 'customer-bubble'}`}>
                          <div className="feed-bubble-text">{msg.body}</div>
                          <div className="feed-bubble-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatFeedEndRef} />
                </div>

                {/* Reply Footer Input */}
                <form onSubmit={handleSendReply} className="feed-reply-footer">
                  {sendSuccess && (
                    <div className="reply-success-bar">
                      <CheckCircle2 size={14} /> Odpověď uložena a e-mail odeslán! / Reply dispatched.
                    </div>
                  )}
                  {sendError && (
                    <div className="reply-error-bar">
                      <ShieldAlert size={14} /> {sendError}
                    </div>
                  )}

                  <div className="reply-input-row">
                    <input 
                      type="text" 
                      placeholder="Napište zákazníkovi odpověď (odešle se také na e-mail)..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={sending}
                      required
                    />
                    <button type="submit" className="reply-send-btn btn-primary" disabled={sending || !replyText.trim()}>
                      {sending ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="no-chat-selected">
                <Mail size={44} style={{ color: 'var(--text-main)', opacity: 0.5, marginBottom: '1rem' }} />
                <h3>Žádná konverzace není vybrána</h3>
                <p>Kliknutím na položku v levém panelu načtěte chat a detaily poptávky.</p>
              </div>
            )}
          </div>

        </div>
      </section>
    </PageTransition>
  );
};

export default AdminInbox;
