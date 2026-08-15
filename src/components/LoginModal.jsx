import React, { useState } from 'react';
import { X, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import './LoginModal.css';

const LoginModal = () => {
  const { isLoginModalOpen, setLoginModalOpen, login, logout, isAdmin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleLogout = async () => {
    await logout();
    setLoginModalOpen(false);
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-card glass-panel">
        <button className="close-modal-btn" onClick={() => setLoginModalOpen(false)}>
          <X size={20} />
        </button>

        {isAdmin ? (
          <div className="logged-in-state">
            <Lock size={40} className="lock-icon" style={{ color: 'var(--secondary-color)', marginBottom: '1rem' }} />
            <h3>Admin Mode is Active</h3>
            <p>You have access to delete reviews and add/remove car listings.</p>
            <button className="btn btn-primary" onClick={handleLogout} style={{ marginTop: '1.5rem', width: '100%' }}>
              Log Out of Admin Mode
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-header">
              <Lock size={32} className="lock-icon" />
              <h3>Admin Authorization</h3>
              <p>Sign in to unlock administrator privileges</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  required 
                  placeholder="admin@easyodtah.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Authorizing...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
