import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import * as Icons from 'lucide-react';
import { API_URL } from '../config';

export default function McpTokenModal() {
  const { isMcpModalOpen, setIsMcpModalOpen } = useBoard();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  if (!isMcpModalOpen) return null;

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMcpModalOpen(false)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 101,
            padding: '28px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-color)',
                }}
              >
                <Icons.Bot size={22} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Conectar Agente IA (MCP)
              </h2>
            </div>
            <button
              onClick={() => setIsMcpModalOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Icons.X size={20} />
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '16px' }}>
              Usa este token de acceso para autorizar a tu cliente de Inteligencia Artificial (como Claude Desktop o Cline) a interactuar con tu cuenta de Cronowork.
            </p>
            
            <div
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              <p
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all',
                  margin: 0,
                  paddingRight: '40px',
                  opacity: 0.8,
                }}
              >
                {token || 'Token no disponible'}
              </p>
              
              <button
                onClick={handleCopy}
                disabled={!token}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '12px',
                  transform: 'translateY(-50%)',
                  background: isCopied ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-secondary)',
                  border: `1px solid ${isCopied ? 'var(--priority-low)' : 'var(--border-color)'}`,
                  color: isCopied ? 'var(--priority-low)' : 'var(--text-secondary)',
                  cursor: token ? 'pointer' : 'not-allowed',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                }}
                title={isCopied ? "¡Copiado!" : "Copiar Token"}
              >
                {isCopied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
              </button>
            </div>
            {isCopied && (
              <p style={{ color: 'var(--priority-low)', fontSize: '0.85rem', marginTop: '8px', textAlign: 'right' }}>
                ¡Token copiado al portapapeles!
              </p>
            )}
          </div>

          <div
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Info size={16} /> Instrucciones de conexión
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
              Configura tu cliente MCP para usar esta URL de servidor SSE: <br/>
              <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-primary)', marginTop: '6px', display: 'inline-block', wordBreak: 'break-all' }}>
                {`${API_URL}/mcp/sse?token=PEGA_AQUÍ_TU_TOKEN`}
              </code>
            </p>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
