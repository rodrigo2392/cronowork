import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import { X, Calendar, Flag } from 'lucide-react';

export default function SprintModal() {
  const {
    isSprintModalOpen,
    setIsSprintModalOpen,
    editingSprint,
    createSprint,
    updateSprint,
  } = useBoard();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    if (editingSprint) {
      setName(editingSprint.name || '');
      setStartDate(editingSprint.startDate ? editingSprint.startDate.split('T')[0] : '');
      setEndDate(editingSprint.endDate ? editingSprint.endDate.split('T')[0] : '');
      setGoal(editingSprint.goal || '');
    } else {
      setName('');
      setStartDate('');
      setEndDate('');
      setGoal('');
    }
  }, [editingSprint, isSprintModalOpen]);

  if (!isSprintModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSprint) {
      updateSprint(editingSprint.id, {
        name: name.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : '',
        endDate: endDate ? new Date(endDate).toISOString() : '',
        goal: goal.trim(),
      });
    } else {
      createSprint({
        name: name.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : '',
        endDate: endDate ? new Date(endDate).toISOString() : '',
        goal: goal.trim(),
      });
    }
    setIsSprintModalOpen(false);
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
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSprintModalOpen(false)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '460px',
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
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flag size={20} className="text-primary" style={{ color: 'var(--accent-color)' }} />
              {editingSprint ? t('sprints.edit') || 'Editar Sprint' : t('sprints.create') || 'Crear Sprint'}
            </h2>
            <button
              onClick={() => setIsSprintModalOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('sprints.name') || 'Nombre del Sprint'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Sprint 1"
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Dates Row */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {t('sprints.startDate') || 'Fecha Inicio'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {t('sprints.endDate') || 'Fecha Fin'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Goal Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('sprints.goal') || 'Meta del Sprint'}
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="ej: Implementar el módulo de autenticación..."
                rows={3}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  resize: 'none',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsSprintModalOpen(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {t('common.cancel') || 'Cancelar'}
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-color)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {editingSprint ? t('common.save') || 'Guardar' : t('sprints.create') || 'Crear Sprint'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
