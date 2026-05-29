import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBoard, resolveDoneColumnId } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import * as Icons from 'lucide-react';

export default function ProjectSettingsModal() {
  const {
    isProjectSettingsModalOpen,
    setIsProjectSettingsModalOpen,
    activeProject,
    updateProjectState,
    deleteProject,
  } = useBoard();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [autoArchiveDays, setAutoArchiveDays] = useState(7);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(true);
  const [autoDeleteArchivedDays, setAutoDeleteArchivedDays] = useState(0);
  const [doneColumnId, setDoneColumnId] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('medium');
  const [defaultTagsInput, setDefaultTagsInput] = useState('');
  const [defaultAssignee, setDefaultAssignee] = useState('');
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifySettings, setNotifySettings] = useState({ muted: false, assign: true, mention: true });

  useEffect(() => {
    if (activeProject) {
      setAutoArchiveDays(activeProject.autoArchiveDays || 7);
      setAutoArchiveEnabled(activeProject.autoArchiveEnabled !== false);
      setAutoDeleteArchivedDays(Number(activeProject.autoDeleteArchivedDays) || 0);
      setDoneColumnId(resolveDoneColumnId(activeProject) || '');
      setDefaultPriority(activeProject.defaultPriority || 'medium');
      setDefaultTagsInput((activeProject.defaultTags || []).join(', '));
      setDefaultAssignee(activeProject.defaultAssignee || '');
      setAutoStartTimer(activeProject.autoStartTimer !== false);
      setAiEnabled(activeProject.aiEnabled !== false);
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
  const isOwner = activeProject.userId === user?.id;
  const memberEmails = Array.from(new Set([
    ...((isOwner && user?.email) ? [user.email] : []),
    ...(activeProject.members || []),
  ]));
  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', cursor: 'pointer'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const defaultTags = defaultTagsInput.split(',').map((tg) => tg.trim()).filter(Boolean);
    const updatedProject = {
      ...activeProject,
      autoArchiveDays: Number(autoArchiveDays),
      autoArchiveEnabled,
      autoDeleteArchivedDays: Number(autoDeleteArchivedDays) || 0,
      doneColumnId: doneColumnId || undefined,
      defaultPriority,
      defaultTags,
      defaultAssignee,
      autoStartTimer,
      aiEnabled,
      notifySettings,
    };
    updateProjectState(updatedProject);
    setIsProjectSettingsModalOpen(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(activeProject, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeProject.name || 'project').replace(/[^a-z0-9-_]+/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar proyecto',
      message: `¿Seguro que deseas eliminar "${activeProject.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true,
    });
    if (ok) {
      deleteProject(activeProject.id);
      setIsProjectSettingsModalOpen(false);
    }
  };

  const switchRow = (checked, onChange, label, description, disabled = false) => (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '2px', width: '16px', height: '16px', cursor: disabled ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-color)' }}
      />
      <span>
        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
        {description && <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{description}</span>}
      </span>
    </label>
  );

  const toggleRow = (key, label, description, disabled = false) =>
    switchRow(
      key === 'muted' ? notifySettings.muted : notifySettings[key],
      (val) => setNotifySettings((prev) => ({ ...prev, [key]: val })),
      label,
      description,
      disabled
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
          maxHeight: '90vh', overflowY: 'auto',
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
              Archivado automático
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Mueve al archivo las tareas terminadas tras cierto tiempo y, opcionalmente, las elimina de forma permanente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {switchRow(autoArchiveEnabled, setAutoArchiveEnabled, 'Auto-archivar tareas finalizadas', 'Las que lleven el tiempo indicado en la columna de completado.')}
              <div style={{ opacity: autoArchiveEnabled ? 1 : 0.5 }}>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Archivar después de</span>
                <select value={autoArchiveDays} disabled={!autoArchiveEnabled} onChange={(e) => setAutoArchiveDays(e.target.value)} style={selectStyle}>
                  <option value={3}>3 días</option>
                  <option value={7}>7 días</option>
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Eliminar tareas archivadas</span>
                <select value={autoDeleteArchivedDays} onChange={(e) => setAutoDeleteArchivedDays(e.target.value)} style={selectStyle}>
                  <option value={0}>Nunca</option>
                  <option value={7}>Tras 7 días</option>
                  <option value={30}>Tras 30 días</option>
                  <option value={90}>Tras 90 días</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Valores por defecto de tareas
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Se aplican al crear una tarea nueva en este proyecto.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Prioridad por defecto</span>
                <select value={defaultPriority} onChange={(e) => setDefaultPriority(e.target.value)} style={selectStyle}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Etiquetas por defecto (separadas por coma)</span>
                <input
                  type="text"
                  value={defaultTagsInput}
                  onChange={(e) => setDefaultTagsInput(e.target.value)}
                  placeholder="ej. backend, urgente"
                  style={{ ...selectStyle, cursor: 'text' }}
                />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Responsable por defecto</span>
                <select value={defaultAssignee} onChange={(e) => setDefaultAssignee(e.target.value)} style={selectStyle}>
                  <option value="">Sin asignar</option>
                  {memberEmails.map((email) => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Cronómetro
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {switchRow(autoStartTimer, setAutoStartTimer, 'Auto-iniciar al pasar a "En progreso"', 'Inicia el cronómetro automáticamente al mover una tarea a una columna de progreso.')}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              Inteligencia Artificial
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {switchRow(aiEnabled, setAiEnabled, 'Permitir generación de tareas con IA', 'Habilita el botón "Generar tareas" y el endpoint de IA para este proyecto.')}
            </div>
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

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--priority-high)', marginBottom: '10px', fontWeight: 600 }}>
              Zona de peligro
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleExport}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', backgroundColor: 'transparent',
                  color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                }}
              >
                <Icons.Download size={16} /> Exportar proyecto (JSON)
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--priority-high)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <Icons.Trash2 size={16} /> Eliminar proyecto
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
