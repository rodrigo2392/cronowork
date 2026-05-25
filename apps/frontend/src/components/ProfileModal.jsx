import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import * as Icons from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, token, checkAuth } = useAuth();
  const { t } = useTranslation();
  
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Removed if (!isOpen) return null; to allow AnimatePresence to work
  console.log("ProfileModal rendered. isOpen: ", isOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // Use the generic update profile endpoint
      const response = await fetch('http://localhost:3500/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage(t('profile.success') || 'Perfil actualizado con éxito');
      checkAuth(); // Refresh user context
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(t('profile.error') || 'Hubo un error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)', padding: '24px',
          borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
              {t('header.profile') || 'Mi Perfil'}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '4px', borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Icons.X size={20} />
            </button>
          </div>

          {error && (
            <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--priority-high)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          
          {message && (
            <div style={{ padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--completed-color)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                {t('profile.name_label') || 'Nombre Completo'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Rodrigo"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
                Correo Electrónico
              </label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-muted)', outline: 'none', fontSize: '0.95rem', cursor: 'not-allowed',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim() || name === user?.name}
              style={{
                marginTop: '8px', padding: '10px', borderRadius: 'var(--radius-md)',
                border: 'none', backgroundColor: 'var(--accent-color)', color: '#fff',
                fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                opacity: (isLoading || !name.trim() || name === user?.name) ? 0.6 : 1,
                transition: 'background-color var(--transition-fast)'
              }}
            >
              {isLoading ? (t('profile.saving') || 'Guardando...') : (t('profile.save') || 'Guardar Cambios')}
            </button>
          </form>
        </div>
    </div>,
    document.body
  );
}
