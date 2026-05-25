import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import Column from './Column';
import ArchiveColumn from './ArchiveColumn';
import * as Icons from 'lucide-react';

export default function Board() {
  const { activeProject, handleDragEnd, isSidebarCollapsed } = useBoard();
  const { t } = useTranslation();

  if (!activeProject) {
    return (
      <div
        className="flex-center"
        style={{
          flexDirection: 'column',
          height: '100%',
          color: 'var(--text-secondary)',
          gap: '12px',
        }}
      >
        <Icons.FolderOpen size={48} style={{ color: 'var(--text-muted)' }} />
        <p>{t('board.no_projects')}</p>
      </div>
    );
  }

  // Handle case where project exists but columnOrder is empty
  if (activeProject.columnOrder.length === 0) {
    return (
      <div
        className="flex-center"
        style={{
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          color: 'var(--text-secondary)',
          gap: '16px',
        }}
      >
        <Icons.Columns size={40} style={{ color: 'var(--text-muted)' }} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{t('board.empty_title')}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {t('board.empty_desc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        height: 'calc(100vh - 120px)', // Subtract header height
        overflowY: 'hidden',
        overflowX: 'auto',
      }}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`column-list ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
              style={{
                display: 'inline-flex',
                padding: '24px',
                height: '100%',
                alignItems: 'flex-start',
                boxSizing: 'border-box',
              }}
            >
              {activeProject.columnOrder.map((columnId, index) => {
                const column = activeProject.columns[columnId];
                if (!column) return null;
                return <Column key={column.id} column={column} index={index} />;
              })}
              {/* Fixed Archive Column */}
              <ArchiveColumn />
              
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
