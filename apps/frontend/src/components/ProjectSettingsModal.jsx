import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBoard, resolveDoneColumnId } from '../context/BoardContext';
import * as Icons from 'lucide-react';

export default function ProjectSettingsModal() {
  const {
    isProjectSettingsModalOpen,
    setIsProjectSettingsModalOpen,
    activeProject,
    updateProjectState
  } = useBoard();

  const [autoArchiveDays, setAutoArchiveDays] = useState(7);
  const [doneColumnId, setDoneColumnId] = useState('');
  const [notifySettings, setNotifySettings] = useState({ muted: false, assign: true, mention: true });

  useEffect(() => {
    if (activeProject) {
      setAutoArchiveDays(activeProject.autoArchiveDays || 7);
      setDoneColumnId(resolveDoneColumnId(activeProject) || '');
      const ns = activeProject.notifySettings || {};
      setNotifySettings({
        muted: !!ns.muted,
        assign: ns.assign !== false,
        mention: ns.mention !== false,
      });
    }
  }, [activeProject, isProjectSettingsModalOpen]);

  if (!isProjectSettingsModalOpen || !activeProject) return null;

  const columnOrder = activeProject.columnOrder || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedProject = {
      ...activeProject,
      autoArchiveDays: Number(autoArchiveDays),
      doneColumnId: doneColumnId || undefined,
      notifySettings,
    };
    updateProjectState(updatedProject);
    setIsProjectSettingsModalOpen(false);
  };

  const toggleRow = (key, label, description, disabled = false) => (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      <input
        type="checkbox"
        checked={key === 'muted' ? notifySettings.muted : notifySettings[key]}
        disabled={disabled}
        onChange={(e) => setNotifySettings((prev) => ({ ...prev, [key]: e.target.checked }))}
        style={{ marginTop: '2px', width: '16px', height: '16px', cursor: disabled ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-color)' }}
      />
      <span>
        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
        {description && <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{description}</span>}
      </span>
    </label>
  );

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
            Ajustes del Proyecto
          </h2>
          <button
            onClick={() => setIsProjectSettingsModalOpen(false)}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Columna de completado
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Define qué columna representa las tareas terminadas. Determina el progreso del proyecto, detiene el cronómetro y dispara el auto-archivado.
            </p>
            <select
              value={doneColumnId}
              onChange={(e) => setDoneColumnId(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {columnOrder.map((colId) => (
                <option key={colId} value={colId}>
                  {activeProject.columns?.[colId]?.title || colId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Auto-archivar tareas finalizadas
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Las tareas que lleven este tiempo en la columna de completado se moverán automáticamente al archivo para mantener tu espacio de trabajo limpio.
            </p>
            <select
              value={autoArchiveDays}
              onChange={(e) => setAutoArchiveDays(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value={3}>3 días</option>
              <option value={7}>7 días</option>
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Notificaciones
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Controla qué eventos de este proyecto generan notificaciones para sus miembros.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {toggleRow('muted', 'Silenciar proyecto', 'No envía ninguna notificación (excepto invitaciones).')}
              {toggleRow('assign', 'Asignación de tareas', 'Avisar cuando se asigna una tarea a alguien.', notifySettings.muted)}
              {toggleRow('mention', 'Menciones', 'Avisar cuando se menciona a alguien en un comentario.', notifySettings.muted)}
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px', padding: '10px', borderRadius: 'var(--radius-md)',
              border: 'none', backgroundColor: 'var(--accent-color)', color: '#fff',
              fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            Guardar Ajustes
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
