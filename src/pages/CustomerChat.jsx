import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { Send, Clock, User, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './CustomerChat.css';

const CustomerChat = () => {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Subscribe to real-time conversation changes in Firestore
  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = onSnapshot(doc(db, 'conversations', id), (snapshot) => {
      if (snapshot.exists()) {
        setConversation({ id: snapshot.id, ...snapshot.data() });
        setError('');
      } else {
        setError('Konverzace nebyla nalezena. / Conversation thread not found.');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Nepodařilo se připojit k chatovací databázi. / Connection error.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversation) return;

    setSending(true);
    const messageId = Math.random().toString(36).substring(2, 9);
    const timeNow = new Date().toISOString();
    
    const messagePayload = {
      id: messageId,
      sender: 'customer',
      senderName: conversation.customerName,
      senderEmail: conversation.customerEmail,
      body: newMessage,
      timestamp: timeNow
    };

    try {
      // 1. Update Firestore
      const docRef = doc(db, 'conversations', id);
      await updateDoc(docRef, {
        messages: arrayUnion(messagePayload),
        lastMessageAt: timeNow
      });

      setNewMessage('');

      // 2. Notify Admin via Email
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'Zákazník odpověděl / Customer Reply',
          name: conversation.customerName,
          email: conversation.customerEmail,
          subject: `Nová zpráva: ${conversation.subject}`,
          message: newMessage,
          conversationId: conversation.id
        })
      });
    } catch (err) {
      console.error(err);
      alert('Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="customer-chat-loading">
          <RefreshCw size={36} className="spin" style={{ color: 'var(--secondary-color)' }} />
          <p>Načítám zabezpečenou konverzaci... / Loading conversation...</p>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="customer-chat-error container">
          <div className="error-box glass-panel">
            <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h2>Vyskytl se problém</h2>
            <p>{error}</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Zpět na hlavní stránku</a>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="customer-chat-page container">
        <div className="chat-portal-card glass-panel">
          <div className="chat-portal-header">
            <div className="header-info">
              <h2>{conversation.subject}</h2>
              <span className="client-badge"><ShieldCheck size={14} /> Zabezpečená zpráva / Secure Thread</span>
            </div>
            <div className="admin-status">
              <span className="status-indicator online"></span>
              <span>easyodtah.cz Podpora / Support</span>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="chat-feed-container">
            <div className="chat-welcome-notice">
              <User size={28} />
              <h4>Konverzace s easyodtah.cz</h4>
              <p>Dobrý den, <strong>{conversation.customerName}</strong>. Toto je vaše přímá, šifrovaná komunikační linka s naší podporou. Veškeré odpovědi se ihned zobrazí oběma stranám.</p>
              <span className="timestamp"><Clock size={12} /> Založeno: {new Date(conversation.messages[0].timestamp).toLocaleString()}</span>
            </div>

            <div className="messages-divider"><span>Historie zpráv / Chat History</span></div>

            {conversation.messages.map((msg, index) => {
              const isAdminMsg = msg.sender === 'admin';
              return (
                <div key={msg.id || index} className={`chat-bubble-row ${isAdminMsg ? 'admin-row' : 'customer-row'}`}>
                  <div className={`chat-bubble ${isAdminMsg ? 'admin-bubble' : 'customer-bubble'}`}>
                    <div className="bubble-sender">
                      {isAdminMsg ? 'easyodtah.cz Podpora' : msg.senderName}
                    </div>
                    <div className="bubble-text">{msg.body}</div>
                    <div className="bubble-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input 
              type="text" 
              placeholder="Napište vaši odpověď zde... / Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              required
            />
            <button type="submit" className="chat-send-btn btn-primary" disabled={sending || !newMessage.trim()}>
              {sending ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </section>
    </PageTransition>
  );
};

export default CustomerChat;
