import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import { X, CheckCircle2, AlertTriangle, ArrowRight, Smile, Frown, Sparkles } from 'lucide-react';

export default function SprintCompleteModal({ sprint, onClose }) {
  const { activeProject, activeDoneColumnId, completeSprint } = useBoard();
  const { t } = useTranslation();

  const [fallbackSprintId, setFallbackSprintId] = useState('backlog');
  
  // Retro States
  const [wellInput, setWellInput] = useState('');
  const [improveInput, setImproveInput] = useState('');
  const [actionInput, setActionInput] = useState('');

  const [wellList, setWellList] = useState([]);
  const [improveList, setImproveList] = useState([]);
  const [actionList, setActionList] = useState([]);

  if (!activeProject || !sprint) return null;

  // Filter tasks in this sprint
  const sprintTasks = Object.values(activeProject.tasks || {}).filter(t => t.sprintId === sprint.id);
  const completedTasks = sprintTasks.filter(t => t.columnId === activeDoneColumnId);
  const pendingTasks = sprintTasks.filter(t => t.columnId !== activeDoneColumnId);

  // DoD validation
  const dodItems = activeProject.definitionOfDone || [];
  const tasksMissingDod = completedTasks.filter(task => {
    const completedCount = (task.dodCompletedItems || []).length;
    return completedCount < dodItems.length;
  });

  const hasDodWarning = tasksMissingDod.length > 0;

  const handleAddRetroItem = (type) => {
    if (type === 'well' && wellInput.trim()) {
      setWellList(prev => [...prev, wellInput.trim()]);
      setWellInput('');
    } else if (type === 'improve' && improveInput.trim()) {
      setImproveList(prev => [...prev, improveInput.trim()]);
      setImproveInput('');
    } else if (type === 'action' && actionInput.trim()) {
      setActionList(prev => [...prev, actionInput.trim()]);
      setActionInput('');
    }
  };

  const handleRemoveRetroItem = (type, index) => {
    if (type === 'well') {
      setWellList(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'improve') {
      setImproveList(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'action') {
      setActionList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const retroData = {
      well: wellList,
      improve: improveList,
      actions: actionList
    };
    completeSprint(sprint.id, fallbackSprintId, retroData);
    onClose();
  };

  // Planned sprints list for fallback options
  const plannedSprints = (activeProject.sprints || []).filter(s => s.id !== sprint.id && s.status === 'planned');

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

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          style={{
            position: 'relative',
            width: '95%',
            maxWidth: '560px',
            maxHeight: '85vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 151,
            padding: '28px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={22} style={{ color: '#10b981' }} />
              {t('sprints.complete') || 'Finalizar Sprint'}: {sprint.name}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. DoD Validation Summary */}
            {dodItems.length > 0 && (
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: hasDodWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${hasDodWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', color: hasDodWarning ? '#f59e0b' : '#10b981' }}>
                  {hasDodWarning ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{hasDodWarning ? 'Definición de Terminado (DoD) Incompleta' : 'DoD Cumplido al 100%'}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {hasDodWarning 
                    ? `Hay ${tasksMissingDod.length} tareas marcadas como completadas que no cumplen con todos los criterios de DoD.`
                    : 'Todas las tareas finalizadas cumplen con todos los criterios del DoD del proyecto.'
                  }
                </p>
              </div>
            )}

            {/* 2. Tasks Destination */}
            {pendingTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Destino de tareas incompletas ({pendingTasks.length})
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  ¿A dónde quieres transferir las tareas que no se terminaron en este sprint?
                </p>
                <select
                  value={fallbackSprintId}
                  onChange={(e) => setFallbackSprintId(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  <option value="backlog">Backlog (Sin sprint)</option>
                  {plannedSprints.map(ps => (
                    <option key={ps.id} value={ps.id}>Mover al {ps.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Retrospective section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {t('sprints.retro') || 'Retrospectiva del Sprint'}
              </label>

              {/* A. What went well */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smile size={14} style={{ color: '#10b981' }} /> {t('sprints.retro.well') || '¿Qué salió bien?'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={wellInput}
                    onChange={(e) => setWellInput(e.target.value)}
                    placeholder="ej: Buena comunicación en las dailies"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddRetroItem('well')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Agregar
                  </button>
                </div>
                {wellList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span>• {item}</span>
                    <button type="button" onClick={() => handleRemoveRetroItem('well', idx)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>

              {/* B. What can be improved */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Frown size={14} style={{ color: '#ef4444' }} /> {t('sprints.retro.improve') || '¿Qué podemos mejorar?'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={improveInput}
                    onChange={(e) => setImproveInput(e.target.value)}
                    placeholder="ej: Subestimamos testing de APIs"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddRetroItem('improve')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Agregar
                  </button>
                </div>
                {improveList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span>• {item}</span>
                    <button type="button" onClick={() => handleRemoveRetroItem('improve', idx)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>

              {/* C. Action Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-color)' }} /> {t('sprints.retro.actions') || 'Acciones para el próximo Sprint'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="ej: Escribir tests unitarios durante el desarrollo"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddRetroItem('action')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--accent-color)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Agregar
                  </button>
                </div>
                {actionList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span>• {item}</span>
                    <button type="button" onClick={() => handleRemoveRetroItem('action', idx)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
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
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Completar Sprint
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
