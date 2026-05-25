import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBoard } from '../context/BoardContext';
import * as Icons from 'lucide-react';

export default function ArchiveModal() {
  const { 
    isArchiveModalOpen, 
    setIsArchiveModalOpen,
    activeProject,
    unarchiveTask
  } = useBoard();

  const archivedTasks = useMemo(() => {
    if (!activeProject || !activeProject.tasks) return [];
    return Object.values(activeProject.tasks)
      .filter(task => task.archived)
      .sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
  }, [activeProject]);

  if (!isArchiveModalOpen || !activeProject) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      padding: '24px'
    }}>
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)', 
          width: '100%', 
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icons.Archive size={24} style={{ color: 'var(--accent-color)' }} />
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
              Historial de Archivo
            </h2>
            <span style={{ 
              backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', 
              borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' 
            }}>
              {archivedTasks.length} tareas
            </span>
          </div>
          <button
            onClick={() => setIsArchiveModalOpen(false)}
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

        <div style={{ 
          padding: '24px', overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {archivedTasks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' 
            }}>
              <Icons.Inbox size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p>No hay tareas archivadas en este proyecto.</p>
            </div>
          ) : (
            archivedTasks.map(task => (
              <div 
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {task.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {task.archivedAt && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Calendar size={12} />
                        Archivado: {new Date(task.archivedAt).toLocaleDateString()}
                      </span>
                    )}
                    {task.assignee && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.User size={12} />
                        {task.assignee}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => unarchiveTask(task.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                    cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                  title="Restaurar al final del tablero"
                >
                  <Icons.RotateCcw size={14} />
                  Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
