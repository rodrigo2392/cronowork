import React, { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import TaskCard from './TaskCard';
import * as Icons from 'lucide-react';

export default function Column({ column, index }) {
  const { t } = useTranslation();
  const {
    activeProject,
    searchQuery,
    filterPriority,
    filterTag,
    editColumn,
    deleteColumn,
    setIsTaskModalOpen,
    setEditingTask,
    setActiveColumnId,
  } = useBoard();
  const { confirm } = useConfirm();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);

  // Get and filter tasks for this column
  const tasks = column.taskIds
    .map((id) => activeProject.tasks[id])
    .filter(Boolean);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

    const matchesTag = filterTag === 'all' || (task.tags && task.tags.includes(filterTag));

    return matchesSearch && matchesPriority && matchesTag;
  });

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    if (titleInput.trim() && titleInput.trim() !== column.title) {
      editColumn(column.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddTaskClick = () => {
    setActiveColumnId(column.id);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleDeleteColumn = async () => {
    const isConfirmed = await confirm({
      title: t('board.delete_col'),
      message: `${t('board.confirm_delete_col')} "${column.title}" ${t('board.confirm_delete_col_desc') || ''}`,
      confirmText: t('board.delete_col'),
      cancelText: t('modal.project.cancel') || 'Cancel',
      isDanger: true
    });
    if (isConfirmed) {
      deleteColumn(column.id);
    }
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            width: 'var(--column-width)',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
            marginRight: 'var(--column-margin)',
          }}
          className={`column-container ${snapshot.isDragging ? 'dragging-column' : ''}`}
        >
          {/* Column Header */}
          <div
            {...provided.dragHandleProps}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
              cursor: 'grab',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginRight: '8px' }}>
              {isEditingTitle ? (
                <form onSubmit={handleTitleSubmit} style={{ width: '100%' }}>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSubmit}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--accent-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </form>
              ) : (
                <h3
                  onDoubleClick={() => setIsEditingTitle(true)}
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'text',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  title={t('board.edit_col')}
                >
                  {column.title}
                </h3>
              )}

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {filteredTasks.length}
              </span>
            </div>

            {/* Column Options */}
            <button
              onClick={handleDeleteColumn}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '6px',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--priority-high)';
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={t('board.delete_col')}
            >
              <Icons.Trash2 size={18} />
            </button>
          </div>

          {/* Scrollable Area to prevent clipping bugs */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Droppable droppableId={column.id} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`task-list ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                  style={{
                    padding: '16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
                    transition: 'background-color var(--transition-fast)',
                    minHeight: '80px',
                  }}
                >
                  {filteredTasks.map((task, idx) => (
                    <TaskCard key={task.id} task={task} index={idx} columnId={column.id} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Add Task Button */}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={handleAddTaskClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icons.Plus size={18} />
              <span>{t('board.add_task')}</span>
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
