import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useBoard } from '../context/BoardContext';
import * as Icons from 'lucide-react';

export default function ArchiveColumn() {
  const { setIsArchiveModalOpen } = useBoard();

  return (
    <div
      style={{
        width: '300px',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        border: '1px dashed var(--border-color)',
        marginRight: '24px',
        opacity: 0.8,
        transition: 'opacity 0.2s, border-color 0.2s',
      }}
      className="archive-column-container"
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.borderColor = 'var(--text-muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <Droppable droppableId="archive-column" type="task">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              minHeight: '200px',
              backgroundColor: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
              borderRadius: 'var(--radius-lg)',
              transition: 'background-color 0.2s ease',
              textAlign: 'center',
            }}
          >
            <Icons.Archive 
              size={48} 
              style={{ 
                color: snapshot.isDraggingOver ? 'var(--accent-color)' : 'var(--text-muted)', 
                marginBottom: '16px',
                transition: 'color 0.2s ease, transform 0.2s ease',
                transform: snapshot.isDraggingOver ? 'scale(1.1)' : 'scale(1)'
              }} 
            />
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.1rem' }}>
              Archivo
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.4' }}>
              {snapshot.isDraggingOver 
                ? 'Suelta aquí para archivar la tarea' 
                : 'Arrastra tareas aquí para archivarlas o visualiza el historial'}
            </p>

            <button
              onClick={() => setIsArchiveModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <Icons.History size={18} />
              Ver tareas finalizadas
            </button>
            
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
