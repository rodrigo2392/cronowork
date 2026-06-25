import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Smile, Frown, Sparkles } from 'lucide-react';

export default function SprintRetroModal({ sprint, onClose }) {
  if (!sprint || !sprint.retro) return null;

  const { well = [], improve = [], actions = [] } = sprint.retro;

  const noteStyle = (bg, border, text) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: bg,
    borderLeft: `4px solid ${border}`,
    color: text,
    fontSize: '0.85rem',
    lineHeight: '1.4',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  });

  const columnStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '150px'
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
          zIndex: 150,
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          style={{
            position: 'relative',
            width: '95%',
            maxWidth: '680px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 151,
            padding: '28px',
            color: 'var(--text-primary)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} style={{ color: 'var(--accent-color)' }} />
              Retrospectiva del Sprint: {sprint.name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Goal Display */}
          {sprint.goal && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '20px', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--accent-color)' }}>
              <strong>Meta:</strong> "{sprint.goal}"
            </p>
          )}

          {/* 3 Columns Layout */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', overflowY: 'auto', maxHeight: '55vh', paddingBottom: '10px' }}>
            
            {/* Column 1: What went well */}
            <div style={columnStyle}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginBottom: '4px' }}>
                <Smile size={16} /> ¿Qué salió bien?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {well.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registrar</div>
                ) : (
                  well.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={noteStyle('rgba(16, 185, 129, 0.04)', '#10b981', 'var(--text-primary)')}
                    >
                      {item}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: What to improve */}
            <div style={columnStyle}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', marginBottom: '4px' }}>
                <Frown size={16} /> ¿Qué mejorar?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {improve.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registrar</div>
                ) : (
                  improve.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={noteStyle('rgba(239, 68, 68, 0.04)', '#ef4444', 'var(--text-primary)')}
                    >
                      {item}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Action items */}
            <div style={columnStyle}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', marginBottom: '4px' }}>
                <Sparkles size={16} /> Acciones
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {actions.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registrar</div>
                ) : (
                  actions.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={noteStyle('rgba(99, 102, 241, 0.04)', 'var(--accent-color)', 'var(--text-primary)')}
                    >
                      {item}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
