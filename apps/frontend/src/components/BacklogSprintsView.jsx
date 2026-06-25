import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import { 
  Plus, Play, CheckCircle2, Edit2, Trash2, Calendar, 
  ChevronDown, ChevronRight, Award, AlignLeft, Info, 
  TrendingUp, BarChart2, BookOpen, User, CheckSquare 
} from 'lucide-react';
import SprintModal from './SprintModal';
import SprintCompleteModal from './SprintCompleteModal';
import SprintBurndownChart from './SprintBurndownChart';
import SprintRetroModal from './SprintRetroModal';

export default function BacklogSprintsView() {
  const {
    activeProject,
    searchQuery,
    filterPriority,
    filterTag,
    activeDoneColumnId,
    createSprint,
    updateSprint,
    startSprint,
    completeSprint,
    deleteSprint,
    assignTaskToSprint,
    setIsSprintModalOpen,
    setEditingSprint,
    setEditingTask,
    setIsTaskModalOpen,
    setActiveColumnId,
    setPresetTaskData,
  } = useBoard();
  
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  
  // Collapse/Expand state for sprints, keyed by sprintId
  const [collapsedSprints, setCollapsedSprints] = useState({});
  // Selected sprint for displaying charts / retros / completing (null = none)
  const [activeBurndownSprint, setActiveBurndownSprint] = useState(null);
  const [activeRetroSprint, setActiveRetroSprint] = useState(null);
  const [completingSprint, setCompletingSprint] = useState(null);

  if (!activeProject) return null;

  // Filter tasks based on Search, Priority, Tag
  const getFilteredTasks = (taskList) => {
    return taskList.filter((task) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesTag = filterTag === 'all' || (task.tags && task.tags.includes(filterTag));

      return matchesSearch && matchesPriority && matchesTag;
    });
  };

  const projectTasks = Object.values(activeProject.tasks || {});
  
  // Backlog tasks (no sprintId or sprintId not found in sprints)
  const sprintIds = new Set((activeProject.sprints || []).map(s => s.id));
  const backlogTasks = projectTasks.filter(t => !t.sprintId || !sprintIds.has(t.sprintId));
  const filteredBacklogTasks = getFilteredTasks(backlogTasks);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const targetSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;
    assignTaskToSprint(draggableId, targetSprintId);
  };

  const toggleSprintCollapse = (sprintId) => {
    setCollapsedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const handleCreateSprintClick = () => {
    setEditingSprint(null);
    setIsSprintModalOpen(true);
  };

  const handleEditSprintClick = (e, sprint) => {
    e.stopPropagation();
    setEditingSprint(sprint);
    setIsSprintModalOpen(true);
  };

  const handleDeleteSprintClick = async (e, sprint) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Eliminar Sprint',
      message: `¿Estás seguro de que quieres eliminar "${sprint.name}"? Las tareas asociadas volverán al backlog.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (isConfirmed) {
      deleteSprint(sprint.id);
    }
  };

  const handleStartSprintClick = async (e, sprint) => {
    e.stopPropagation();
    const hasActive = (activeProject.sprints || []).some(s => s.status === 'active');
    if (hasActive) {
      alert('Ya hay un sprint activo. Debes completarlo antes de iniciar otro.');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Iniciar Sprint',
      message: `¿Quieres iniciar el "${sprint.name}" ahora?`,
      confirmText: 'Iniciar',
      cancelText: 'Cancelar',
    });
    if (isConfirmed) {
      startSprint(sprint.id);
    }
  };

  const handleCompleteSprintClick = (e, sprint) => {
    e.stopPropagation();
    setCompletingSprint(sprint);
  };

  const handleTaskClick = (task) => {
    setActiveColumnId(task.columnId);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTaskInBacklog = () => {
    const firstColumnId = activeProject.columnOrder?.[0] || 'column-todo';
    setActiveColumnId(firstColumnId);
    setPresetTaskData({ sprintId: null });
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleCreateTaskInSprint = (e, sprintId) => {
    e.stopPropagation();
    const firstColumnId = activeProject.columnOrder?.[0] || 'column-todo';
    setActiveColumnId(firstColumnId);
    setPresetTaskData({ sprintId });
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--priority-high, #ef4444)';
      case 'medium': return 'var(--priority-medium, #f59e0b)';
      case 'low': return 'var(--priority-low, #10b981)';
      default: return 'var(--text-muted, #94a3b8)';
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, gap: '24px', padding: '24px', height: 'calc(100vh - 120px)', minHeight: 0, boxSizing: 'border-box' }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        
        {/* Left Column: Sprints */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={22} style={{ color: 'var(--accent-color)' }} />
              {t('sprints.title') || 'Sprints'}
            </h2>
            <button
              onClick={handleCreateSprintClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-color)',
                border: 'none',
                color: '#fff',
                fontWeight: 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Plus size={16} />
              {t('sprints.create') || 'Crear Sprint'}
            </button>
          </div>

          {/* Sprints Scroll Container */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
            {(!activeProject.sprints || activeProject.sprints.length === 0) ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)',
                gap: '12px',
                marginTop: '20px'
              }}>
                <BookOpen size={36} />
                <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>No hay sprints creados en este proyecto. Haz clic en "Crear Sprint" para comenzar.</p>
              </div>
            ) : (
              activeProject.sprints.map(sprint => {
                const sprintTasks = projectTasks.filter(t => t.sprintId === sprint.id);
                const filteredSprintTasks = getFilteredTasks(sprintTasks);
                const isCollapsed = !!collapsedSprints[sprint.id];
                
                // Calculations
                const completedTasks = sprintTasks.filter(t => t.columnId === activeDoneColumnId);
                const totalTasksCount = sprintTasks.length;
                const completedTasksCount = completedTasks.length;
                
                const totalSP = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
                const completedSP = completedTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
                
                const taskProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
                const spProgress = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;

                return (
                  <div
                    key={sprint.id}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: `1px solid ${sprint.status === 'active' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      boxShadow: sprint.status === 'active' ? '0 0 10px rgba(99, 102, 241, 0.15)' : 'var(--shadow-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Sprint Header */}
                    <div
                      onClick={() => toggleSprintCollapse(sprint.id)}
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {sprint.name}
                          </span>
                          
                          {/* Status Badge */}
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '99px',
                            backgroundColor: sprint.status === 'active' ? 'rgba(99, 102, 241, 0.15)' : sprint.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            color: sprint.status === 'active' ? 'var(--accent-color)' : sprint.status === 'completed' ? '#10b981' : '#94a3b8',
                            border: `1px solid ${sprint.status === 'active' ? 'rgba(99, 102, 241, 0.25)' : sprint.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`,
                          }}>
                            {sprint.status === 'active' ? (t('sprints.status.active') || 'Activo') : sprint.status === 'completed' ? (t('sprints.status.completed') || 'Completado') : (t('sprints.status.planned') || 'Planificado')}
                          </span>

                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                            <Calendar size={13} />
                            {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Sin fecha'} - {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'Sin fecha'}
                          </span>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                          {sprint.status === 'planned' && (
                            <button
                              onClick={(e) => handleStartSprintClick(e, sprint)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <Play size={12} />
                              {t('sprints.start') || 'Iniciar'}
                            </button>
                          )}
                          {sprint.status === 'active' && (
                            <>
                              <button
                                onClick={(e) => handleCompleteSprintClick(e, sprint)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                  border: '1px solid var(--accent-color)',
                                  color: 'var(--accent-color)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <CheckCircle2 size={12} />
                                {t('sprints.complete') || 'Completar'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveBurndownSprint(sprint);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <BarChart2 size={12} />
                                Burndown
                              </button>
                            </>
                          )}
                          {sprint.status === 'completed' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveBurndownSprint(sprint);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <BarChart2 size={12} />
                                Burndown
                              </button>
                              {sprint.retro && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveRetroSprint(sprint);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Award size={12} />
                                  Retro
                                </button>
                              )}
                            </>
                          )}
                          {sprint.status !== 'completed' && (
                            <>
                              <button
                                onClick={(e) => handleCreateTaskInSprint(e, sprint.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <Plus size={12} />
                                {t('task.create_short') || '+ Tarea'}
                              </button>
                              <button
                                onClick={(e) => handleEditSprintClick(e, sprint)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '6px',
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => handleDeleteSprintClick(e, sprint)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '6px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Goal / Info */}
                      {sprint.goal && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '26px' }}>
                          "{sprint.goal}"
                        </div>
                      )}

                      {/* Metric info bar */}
                      <div style={{ display: 'flex', gap: '24px', paddingLeft: '26px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>
                          Tareas: <strong style={{ color: 'var(--text-primary)' }}>{completedTasksCount}/{totalTasksCount}</strong>
                          <span style={{ marginLeft: '6px' }}>({taskProgress}%)</span>
                        </div>
                        <div>
                          Story Points: <strong style={{ color: 'var(--text-primary)' }}>{completedSP}/{totalSP} {t('sprints.storyPointsShort') || 'SP'}</strong>
                          <span style={{ marginLeft: '6px' }}>({spProgress}%)</span>
                        </div>
                      </div>
                      
                      {/* Double progress bar */}
                      <div style={{ width: '100%', paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {/* Task completion progress bar */}
                        <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${taskProgress}%`, backgroundColor: '#3b82f6', transition: 'width 0.3s ease' }} />
                        </div>
                        {/* SP completion progress bar */}
                        {totalSP > 0 && (
                          <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${spProgress}%`, backgroundColor: 'var(--accent-color)', transition: 'width 0.3s ease' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sprint Tasks Container */}
                    {!isCollapsed && (
                      <Droppable droppableId={sprint.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            style={{
                              padding: '16px',
                              minHeight: '80px',
                              backgroundColor: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              borderBottom: '1px solid var(--border-color)'
                            }}
                          >
                            {filteredSprintTasks.length === 0 ? (
                              <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                fontStyle: 'italic'
                              }}>
                                Arrastra tareas aquí para planificar este sprint.
                              </div>
                            ) : (
                              filteredSprintTasks.map((task, taskIndex) => (
                                <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                                  {(taskProvided, taskSnapshot) => (
                                    <div
                                      ref={taskProvided.innerRef}
                                      {...taskProvided.draggableProps}
                                      {...taskProvided.dragHandleProps}
                                      onClick={() => handleTaskClick(task)}
                                      style={{
                                        ...taskProvided.draggableProps.style,
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        border: `1px solid ${taskSnapshot.isDragging ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                        boxShadow: taskSnapshot.isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        {/* Status bullet */}
                                        <div style={{
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: task.columnId === activeDoneColumnId ? '#10b981' : 'var(--text-muted)',
                                          flexShrink: 0
                                        }} />
                                        <span style={{
                                          fontWeight: 500,
                                          fontSize: '0.88rem',
                                          color: 'var(--text-primary)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          textDecoration: task.columnId === activeDoneColumnId ? 'line-through' : 'none',
                                          opacity: task.columnId === activeDoneColumnId ? 0.6 : 1
                                        }}>
                                          {task.title}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        {/* Priority badge */}
                                        {task.priority && (
                                          <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: `${getPriorityColor(task.priority)}15`,
                                            color: getPriorityColor(task.priority),
                                            border: `1px solid ${getPriorityColor(task.priority)}30`,
                                            textTransform: 'uppercase',
                                          }}>
                                            {task.priority}
                                          </span>
                                        )}
                                        {/* Story Points badge */}
                                        {task.storyPoints !== null && task.storyPoints !== undefined ? (
                                          <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '99px',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            color: 'var(--accent-color)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '2px'
                                          }}>
                                            {task.storyPoints} <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>SP</span>
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>--</span>
                                        )}
                                        {/* Assignee initials */}
                                        {task.assignee ? (
                                          <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--accent-color)',
                                            color: '#fff',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textTransform: 'uppercase'
                                          }} title={task.assignee}>
                                            {task.assignee.substring(0, 2)}
                                          </div>
                                        ) : (
                                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Backlog */}
        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlignLeft size={22} style={{ color: 'var(--text-secondary)' }} />
              {t('sprints.backlog') || 'Backlog'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleCreateTaskInBacklog}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                {t('board.add_task') || 'Añadir Tarea'}
              </button>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {filteredBacklogTasks.length} {filteredBacklogTasks.length === 1 ? 'tarea' : 'tareas'}
              </div>
            </div>
          </div>

          {/* Droppable Area Backlog */}
          <Droppable droppableId="backlog" type="task">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {filteredBacklogTasks.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    color: 'var(--text-muted)',
                    gap: '12px',
                    margin: 'auto'
                  }}>
                    <CheckSquare size={32} />
                    <p style={{ fontSize: '0.85rem', textAlign: 'center' }}>No hay tareas en el backlog.</p>
                  </div>
                ) : (
                  filteredBacklogTasks.map((task, taskIndex) => (
                    <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                      {(taskProvided, taskSnapshot) => (
                        <div
                          ref={taskProvided.innerRef}
                          {...taskProvided.draggableProps}
                          {...taskProvided.dragHandleProps}
                          onClick={() => handleTaskClick(task)}
                          style={{
                            ...taskProvided.draggableProps.style,
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-tertiary)',
                            border: `1px solid ${taskSnapshot.isDragging ? 'var(--accent-color)' : 'var(--border-color)'}`,
                            boxShadow: taskSnapshot.isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--text-muted)',
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontWeight: 500,
                              fontSize: '0.88rem',
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {task.title}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {/* Priority badge */}
                            {task.priority && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: `${getPriorityColor(task.priority)}15`,
                                color: getPriorityColor(task.priority),
                                border: `1px solid ${getPriorityColor(task.priority)}30`,
                                textTransform: 'uppercase',
                              }}>
                                {task.priority}
                              </span>
                            )}
                            {/* Story Points badge */}
                            {task.storyPoints !== null && task.storyPoints !== undefined ? (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '99px',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--accent-color)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}>
                                {task.storyPoints} <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>SP</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>--</span>
                            )}
                            {/* Assignee initials */}
                            {task.assignee ? (
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-color)',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textTransform: 'uppercase'
                              }} title={task.assignee}>
                                {task.assignee.substring(0, 2)}
                              </div>
                            ) : (
                              <User size={14} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
      
      {/* Include Sprints Modals here */}
      <SprintModal />

      {completingSprint && (
        <SprintCompleteModal
          sprint={completingSprint}
          onClose={() => setCompletingSprint(null)}
        />
      )}

      {activeBurndownSprint && (
        <SprintBurndownChart
          sprint={activeBurndownSprint}
          onClose={() => setActiveBurndownSprint(null)}
        />
      )}

      {activeRetroSprint && (
        <SprintRetroModal
          sprint={activeRetroSprint}
          onClose={() => setActiveRetroSprint(null)}
        />
      )}
    </div>
  );
}
