import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from './LanguageContext';

const BoardContext = createContext(undefined);

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};

export const BoardProvider = ({ children }) => {
  const { token, user } = useAuth();
  const { t } = useTranslation();

  // Main state - strictly from backend
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [initialUrlParsed, setInitialUrlParsed] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);

  // Fetch from backend
  useEffect(() => {
    if (!token) {
      setIsProjectsLoading(false);
      setAllUsers([]);
      return;
    }

    setIsProjectsLoading(true);
    setFetchError(false);

    // Fetch all users for assigning tasks
    fetch('http://localhost:3500/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllUsers(data);
      })
      .catch(err => console.error("Could not fetch users:", err));
    fetch('http://localhost:3500/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Sync backend data into state (removing local duplicates just in case)
          const cleanData = data.map(project => {
            const seenTaskIds = new Set();
            const newColumns = {};
            if (project.columnOrder && project.columns) {
              for (const colId of project.columnOrder) {
                const col = project.columns[colId];
                if (!col) continue;
                const uniqueTaskIds = [];
                for (const id of (col.taskIds || [])) {
                  if (!seenTaskIds.has(id)) {
                    seenTaskIds.add(id);
                    uniqueTaskIds.push(id);
                  }
                }
                newColumns[colId] = { ...col, taskIds: uniqueTaskIds };
              }
            }
            return {
              ...project,
              tasks: project.tasks || {},
              columns: newColumns || project.columns || {},
              columnOrder: project.columnOrder || [],
              activityLog: project.activityLog || []
            };
          });
          setProjects(cleanData);
          
          // Ensure activeProjectId is valid
          setActiveProjectId(prev => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlProject = urlParams.get('project');
            if (urlProject && cleanData.some(p => p.id === urlProject)) {
              return urlProject;
            }
            if (prev && cleanData.some(p => p.id === prev)) return prev;
            return cleanData[0].id;
          });
        } else {
          // Backend is empty
          setProjects([]);
        }
      })
      .catch(err => {
        console.error("Could not fetch from backend:", err);
        setFetchError(true);
      })
      .finally(() => {
        setIsProjectsLoading(false);
      });
  }, [token]);

  const [activeProjectId, setActiveProjectId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProject = urlParams.get('project');
    if (urlProject) return urlProject; // Trust URL initially

    const savedActive = localStorage.getItem('vibe_kanban_active_id');
    if (savedActive) return savedActive;

    return projects[0]?.id || '';
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  // Modals and UI State
  const [activeTask, setActiveTask] = useState(null); // Task detail modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Task to edit (can be empty for create)
  const [activeColumnId, setActiveColumnId] = useState(null); // Track which column to add task to
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  
  // Global Time Tracker State
  const [activeTracker, setActiveTracker] = useState(null); // { taskId, taskTitle, startTime, accumulatedTime }

  const startTracking = (taskId) => {
    if (activeTracker && activeTracker.taskId !== taskId) {
      stopTracking();
    }
    
    if (!projects.length) return;
    // Find task across all projects if needed, or assume it's in activeProject
    const proj = projects.find(p => p.id === activeProjectId) || projects[0];
    if (!proj || !proj.tasks[taskId]) return;
    
    const task = proj.tasks[taskId];
    const currentLogs = task.timeLogs || [];
    const totalCurrent = currentLogs.reduce((acc, log) => acc + log.duration, 0);
    
    setActiveTracker({
      taskId,
      taskTitle: task.title,
      startTime: Date.now(),
      accumulatedTime: totalCurrent
    });
  };

  const stopTracking = () => {
    if (!activeTracker) return;
    const elapsedSeconds = Math.floor((Date.now() - activeTracker.startTime) / 1000);
    
    const proj = projects.find(p => p.id === activeProjectId) || projects[0];
    const task = proj?.tasks[activeTracker.taskId];
    
    if (task && elapsedSeconds > 0) {
      const newLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user?.id || "anon",
        userName: user?.name || "Usuario",
        duration: elapsedSeconds,
        createdAt: new Date().toISOString()
      };
      
      const updatedLogs = [...(task.timeLogs || []), newLog];
      editTask(activeTracker.taskId, { timeLogs: updatedLogs });
    }
    
    setActiveTracker(null);
  };


  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('vibe_kanban_active_id', activeProjectId);
    }
  }, [activeProjectId]);

  // Parse initial task from URL
  useEffect(() => {
    if (!isProjectsLoading && projects.length > 0 && !initialUrlParsed) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTask = urlParams.get('task');
      if (urlTask) {
        const proj = projects.find(p => p.id === activeProjectId) || projects[0];
        if (proj && proj.tasks && proj.tasks[urlTask]) {
          setEditingTask(proj.tasks[urlTask]);
          setIsTaskModalOpen(true);
        }
      }
      setInitialUrlParsed(true);
    }
  }, [isProjectsLoading, projects, activeProjectId, initialUrlParsed]);

  // Sync state to URL dynamically
  useEffect(() => {
    if (isProjectsLoading || projects.length === 0 || !initialUrlParsed) return;
    
    const url = new URL(window.location.href);
    let changed = false;

    if (activeProjectId && url.searchParams.get('project') !== activeProjectId) {
      url.searchParams.set('project', activeProjectId);
      changed = true;
    }

    if (isTaskModalOpen && editingTask) {
      if (url.searchParams.get('task') !== editingTask.id) {
        url.searchParams.set('task', editingTask.id);
        changed = true;
      }
    } else {
      if (url.searchParams.has('task')) {
        url.searchParams.delete('task');
        changed = true;
      }
    }

    if (changed) {
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeProjectId, isTaskModalOpen, editingTask, isProjectsLoading, projects.length, initialUrlParsed]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const saveTimeoutRef = useRef(null);

  // Update specific project in projects array and sync to backend
  const updateProjectState = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    // Debounce the backend save to prevent spamming during rapid edits or drags
    if (!token) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`http://localhost:3500/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProject)
      }).catch(err => console.error('Failed to sync update to backend:', err));
    }, 1500);
  };

  // Activity Logger helper
  const logActivity = (projectId, text) => {
    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      time: new Date().toISOString(),
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          activityLog: [newActivity, ...(p.activityLog || [])].slice(0, 50), // keep last 50 activities
        };
      }
      return p;
    }));
  };

  // --- Project CRUD ---
  const addProject = (name, description, icon = 'Layers', prefix = '') => {
    const newId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newProj = {
      id: newId,
      name,
      prefix,
      description,
      icon,
      members: [],
      tasks: {},
      columns: {
        'column-todo': { id: 'column-todo', title: t('board.col_todo'), taskIds: [] },
        'column-inprogress': { id: 'column-inprogress', title: t('board.col_inprogress'), taskIds: [] },
        'column-done': { id: 'column-done', title: t('board.col_done'), taskIds: [] }
      },
      columnOrder: ['column-todo', 'column-inprogress', 'column-done'],
      activityLog: [{ id: `act-${Date.now()}`, text: `Project "${name}" created`, time: new Date().toISOString() }]
    };
    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newId);
    
    // Sync creation to backend
    if (token) {
      fetch('http://localhost:3500/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProj)
      }).catch(err => console.error('Failed to create project on backend:', err));
    }
  };

  const addProjectAsync = async (name, description, icon = 'Layers', prefix = '') => {
    const newId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newProj = {
      id: newId,
      name,
      prefix,
      description,
      icon,
      members: [],
      tasks: {},
      columns: {
        'column-todo': { id: 'column-todo', title: t('board.col_todo'), taskIds: [] },
        'column-inprogress': { id: 'column-inprogress', title: t('board.col_inprogress'), taskIds: [] },
        'column-done': { id: 'column-done', title: t('board.col_done'), taskIds: [] }
      },
      columnOrder: ['column-todo', 'column-inprogress', 'column-done'],
      activityLog: [{ id: `act-${Date.now()}`, text: `Project "${name}" created`, time: new Date().toISOString() }]
    };
    
    // First save to backend
    if (token) {
      const response = await fetch('http://localhost:3500/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProj)
      });
      if (!response.ok) {
        throw new Error('Failed to create project on backend');
      }
      const savedProj = await response.json();
      setProjects(prev => [...prev, savedProj]);
      setActiveProjectId(savedProj.id);
      return savedProj;
    } else {
      setProjects(prev => [...prev, newProj]);
      setActiveProjectId(newId);
      return newProj;
    }
  };

  const editProject = (projectId, name, description, icon, prefix = '') => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updated = {
      ...proj,
      name,
      description,
      icon,
      prefix,
    };
    updateProjectState(updated);
    logActivity(projectId, `Project details updated`);
  };

  const deleteProject = (projectId) => {
    const remaining = projects.filter(p => p.id !== projectId);
    setProjects(remaining);
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0]?.id || '');
    }
    
    // Sync deletion to backend
    if (token) {
      fetch(`http://localhost:3500/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.error('Failed to delete project on backend:', err));
    }
  };

  const inviteMember = async (projectId, email) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) throw new Error("Project not found");
    const currentMembers = proj.members || [];
    if (currentMembers.includes(email)) throw new Error("already_member");
    
    if (token) {
      const response = await fetch(`http://localhost:3500/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.message || '';
        if (msg.includes('exist')) {
          throw new Error("user_not_found");
        } else if (msg.includes('already part') || msg.includes('already invited')) {
          throw new Error("already_member");
        }
        throw new Error("generic");
      }
      
      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      logActivity(projectId, `Invited ${email} to project`);
    } else {
      // Local fallback
      const updated = {
        ...proj,
        members: [...currentMembers, email]
      };
      updateProjectState(updated);
      logActivity(projectId, `Invited ${email} to project (Local)`);
    }
  };

  // --- Column CRUD ---
  const addColumn = (title) => {
    if (!activeProject) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const colId = `column-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const updated = {
      ...activeProject,
      columns: {
        ...activeProject.columns,
        [colId]: {
          id: colId,
          title: cleanTitle,
          taskIds: [],
        }
      },
      columnOrder: [...activeProject.columnOrder, colId]
    };
    updateProjectState(updated);
    logActivity(activeProject.id, `Created column "${cleanTitle}"`);
  };

  const editColumn = (columnId, title) => {
    if (!activeProject) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    
    const updated = {
      ...activeProject,
      columns: {
        ...activeProject.columns,
        [columnId]: {
          ...activeProject.columns[columnId],
          title: cleanTitle,
        }
      }
    };
    updateProjectState(updated);
    logActivity(activeProject.id, `Renamed column to "${cleanTitle}"`);
  };

  const deleteColumn = (columnId) => {
    if (!activeProject) return;
    const col = activeProject.columns[columnId];
    if (!col) return;
    
    // Delete tasks inside this column
    const updatedTasks = { ...activeProject.tasks };
    col.taskIds.forEach(id => {
      delete updatedTasks[id];
    });

    const updatedColumns = { ...activeProject.columns };
    delete updatedColumns[columnId];

    const updatedColumnOrder = activeProject.columnOrder.filter(id => id !== columnId);

    const updated = {
      ...activeProject,
      tasks: updatedTasks,
      columns: updatedColumns,
      columnOrder: updatedColumnOrder
    };
    updateProjectState(updated);
    logActivity(activeProject.id, `Deleted column "${col.title}"`);
  };

  // --- Task CRUD ---
  const addTask = (columnId, taskData) => {
    if (!activeProject) return;
    
    // Generate Task ID
    let taskId;
    if (activeProject.prefix) {
      taskId = `${activeProject.prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    } else {
      taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    
    const newTask = {
      id: taskId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      comments: taskData.comments || [],
      dueDate: taskData.dueDate || '',
      createdAt: new Date().toISOString()
    };

    const updatedProject = {
      ...activeProject,
      tasks: {
        ...activeProject.tasks,
        [taskId]: newTask
      },
      columns: {
        ...activeProject.columns,
        [columnId]: {
          ...activeProject.columns[columnId],
          taskIds: [...activeProject.columns[columnId].taskIds, taskId]
        }
      }
    };
    updateProjectState(updatedProject);
    logActivity(activeProject.id, `Created task "${newTask.title}"`);
  };

  const editTask = (taskId, updatedTaskData) => {
    if (!activeProject) return;
    const updatedTask = {
      ...activeProject.tasks[taskId],
      ...updatedTaskData
    };

    const updatedProject = {
      ...activeProject,
      tasks: {
        ...activeProject.tasks,
        [taskId]: updatedTask
      }
    };
    
    updateProjectState(updatedProject);
    // If the edited task is currently active in detail modal, update it
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(updatedTask);
    }
    logActivity(activeProject.id, `Updated task "${updatedTask.title}"`);
  };

  const deleteTask = (columnId, taskId) => {
    if (!activeProject) return;
    const taskTitle = activeProject.tasks[taskId]?.title || 'Task';
    
    const updatedTasks = { ...activeProject.tasks };
    delete updatedTasks[taskId];

    const updatedColumn = {
      ...activeProject.columns[columnId],
      taskIds: activeProject.columns[columnId].taskIds.filter(id => id !== taskId)
    };

    const updatedProject = {
      ...activeProject,
      tasks: updatedTasks,
      columns: {
        ...activeProject.columns,
        [columnId]: updatedColumn
      }
    };

    updateProjectState(updatedProject);
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(null);
      setIsTaskModalOpen(false);
    }
    logActivity(activeProject.id, `Deleted task "${taskTitle}"`);
  };

  // --- Subtask Actions ---
  const toggleSubtask = (taskId, subtaskId) => {
    if (!activeProject) return;
    const task = activeProject.tasks[taskId];
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(sub => 
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );

    editTask(taskId, { subtasks: updatedSubtasks });
  };

  const addSubtask = (taskId, text) => {
    if (!activeProject) return;
    const task = activeProject.tasks[taskId];
    if (!task) return;

    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text,
      completed: false
    };

    editTask(taskId, { subtasks: [...task.subtasks, newSub] });
  };

  const deleteSubtask = (taskId, subtaskId) => {
    if (!activeProject) return;
    const task = activeProject.tasks[taskId];
    if (!task) return;

    const updatedSubtasks = task.subtasks.filter(sub => sub.id !== subtaskId);
    editTask(taskId, { subtasks: updatedSubtasks });
  };

  // --- Archive Actions ---
  const archiveTask = (taskId, sourceColumnId) => {
    if (!activeProject) return;
    const task = activeProject.tasks[taskId];
    if (!task) return;

    let updatedColumns = { ...activeProject.columns };
    
    // Remove from column if sourceColumnId is provided
    if (sourceColumnId && updatedColumns[sourceColumnId]) {
      updatedColumns[sourceColumnId] = {
        ...updatedColumns[sourceColumnId],
        taskIds: updatedColumns[sourceColumnId].taskIds.filter(id => id !== taskId)
      };
    }

    const updatedTask = {
      ...task,
      archived: true,
      archivedAt: new Date().toISOString()
    };

    const updatedProject = {
      ...activeProject,
      tasks: {
        ...activeProject.tasks,
        [taskId]: updatedTask
      },
      columns: updatedColumns
    };

    updateProjectState(updatedProject);
    logActivity(activeProject.id, `Archived task "${task.title}"`);
  };

  const unarchiveTask = (taskId) => {
    if (!activeProject || !activeProject.columnOrder.length) return;
    const task = activeProject.tasks[taskId];
    if (!task) return;

    // Restore to the last column by default
    const destColumnId = activeProject.columnOrder[activeProject.columnOrder.length - 1];

    const updatedTask = { ...task };
    delete updatedTask.archived;
    delete updatedTask.archivedAt;

    const updatedProject = {
      ...activeProject,
      tasks: {
        ...activeProject.tasks,
        [taskId]: updatedTask
      },
      columns: {
        ...activeProject.columns,
        [destColumnId]: {
          ...activeProject.columns[destColumnId],
          taskIds: [...activeProject.columns[destColumnId].taskIds, taskId]
        }
      }
    };

    updateProjectState(updatedProject);
    logActivity(activeProject.id, `Unarchived task "${task.title}"`);
  };

  // --- Auto Archive Logic ---
  useEffect(() => {
    if (!activeProject || !activeProject.columnOrder.length) return;

    const lastColumnId = activeProject.columnOrder[activeProject.columnOrder.length - 1];
    const lastColumn = activeProject.columns[lastColumnId];
    if (!lastColumn || !lastColumn.taskIds.length) return;

    // Get autoArchiveDays from project config, default to 7
    const archiveDays = activeProject.autoArchiveDays || 7;
    const archiveMs = archiveDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let tasksToArchive = [];
    
    lastColumn.taskIds.forEach(taskId => {
      const task = activeProject.tasks[taskId];
      if (task && !task.archived) {
        // If the task has an updatedAt or we rely on a completedAt, but we don't have one explicitly.
        // Let's use the task's last timeLog or just the fact it's in this column.
        // To be accurate, we should really track when it entered the column.
        // But for simplicity without schema migration, we'll check if there's an 'updatedAt' or if we can infer from timeLogs.
        // Alternatively, since we don't have a strict 'movedToLastColumnAt', we'll simulate auto-archive by a simpler heuristic or we must add a timestamp.
        // For now, let's use a mocked logic: we add a property `movedToDoneAt` when it enters the last column in handleDragEnd.
        // Let's check `movedToDoneAt`.
        if (task.movedToDoneAt) {
          const timeInDone = now - new Date(task.movedToDoneAt).getTime();
          if (timeInDone > archiveMs) {
            tasksToArchive.push(taskId);
          }
        }
      }
    });

    if (tasksToArchive.length > 0) {
      // Archive them in batch
      let updatedColumns = { ...activeProject.columns };
      let updatedTasks = { ...activeProject.tasks };

      updatedColumns[lastColumnId] = {
        ...lastColumn,
        taskIds: lastColumn.taskIds.filter(id => !tasksToArchive.includes(id))
      };

      tasksToArchive.forEach(taskId => {
        updatedTasks[taskId] = {
          ...updatedTasks[taskId],
          archived: true,
          archivedAt: new Date().toISOString()
        };
      });

      const updatedProject = {
        ...activeProject,
        tasks: updatedTasks,
        columns: updatedColumns
      };
      
      updateProjectState(updatedProject);
      tasksToArchive.forEach(id => logActivity(activeProject.id, `Auto-archived task "${updatedTasks[id].title}"`));
    }
  }, [activeProject]);

  // --- Drag and Drop Movement Handler ---
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle drop on special Archive column
    if (destination.droppableId === 'archive-column') {
      archiveTask(draggableId, source.droppableId);
      return;
    }

    if (!activeProject) return;

    // Handle column reordering
    if (type === 'column') {
      const newColumnOrder = Array.from(activeProject.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      const updated = {
        ...activeProject,
        columnOrder: newColumnOrder
      };
      updateProjectState(updated);
      logActivity(activeProject.id, `Reordered columns`);
      return;
    }

    // Handle task movement
    const sourceCol = activeProject.columns[source.droppableId];
    const destCol = activeProject.columns[destination.droppableId];

    if (sourceCol === destCol) {
      // Reordering in same column
      const newTaskIds = Array.from(sourceCol.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const updatedCol = {
        ...sourceCol,
        taskIds: newTaskIds
      };

      const updated = {
        ...activeProject,
        columns: {
          ...activeProject.columns,
          [sourceCol.id]: updatedCol
        }
      };
      updateProjectState(updated);
    } else {
      // Moving to different column
      const sourceTaskIds = Array.from(sourceCol.taskIds);
      sourceTaskIds.splice(source.index, 1);
      
      const destTaskIds = Array.from(destCol.taskIds);
      destTaskIds.splice(destination.index, 0, draggableId);

      const updatedSourceCol = {
        ...sourceCol,
        taskIds: sourceTaskIds
      };

      const updatedDestCol = {
        ...destCol,
        taskIds: destTaskIds
      };

      const taskTitle = activeProject.tasks[draggableId]?.title || 'Task';
      let updatedTaskData = { ...activeProject.tasks[draggableId] };

      // Automations
      const isFirstColumn = destCol.id === activeProject.columnOrder[0];
      if (!isFirstColumn && !updatedTaskData.assignee && user?.email) {
        updatedTaskData.assignee = user.email;
        // The activity log will be created separately
      }

      const isLastColumn = destCol.id === activeProject.columnOrder[activeProject.columnOrder.length - 1];
      if (isLastColumn) {
        updatedTaskData.movedToDoneAt = new Date().toISOString();
        if (activeTracker && activeTracker.taskId === draggableId) {
          const elapsedSeconds = Math.floor((Date.now() - activeTracker.startTime) / 1000);
          if (elapsedSeconds > 0) {
            const newLog = {
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              userId: user?.id || "anon",
              userName: user?.name || "Usuario",
              duration: elapsedSeconds,
              createdAt: new Date().toISOString()
            };
            updatedTaskData.timeLogs = [...(updatedTaskData.timeLogs || []), newLog];
          }
          setActiveTracker(null);
        }
      } else {
        // If it was moved out of the last column, clear the timestamp
        delete updatedTaskData.movedToDoneAt;
      }

      const updated = {
        ...activeProject,
        tasks: {
          ...activeProject.tasks,
          [draggableId]: updatedTaskData
        },
        columns: {
          ...activeProject.columns,
          [sourceCol.id]: updatedSourceCol,
          [destCol.id]: updatedDestCol
        }
      };
      updateProjectState(updated);
      
      let activityMsg = `Moved "${taskTitle}" from "${sourceCol.title}" to "${destCol.title}"`;
      if (!isFirstColumn && updatedTaskData.assignee === user?.email && !activeProject.tasks[draggableId]?.assignee) {
        activityMsg += ` and auto-assigned`;
      }
      if (isLastColumn && activeTracker && activeTracker.taskId === draggableId) {
        activityMsg += ` (timer auto-stopped)`;
      }

      // Auto-start tracker if moved to a "Progreso" / "Progress" column
      const destTitleLower = destCol.title.toLowerCase();
      const isProgressColumn = destTitleLower.includes('progreso') || destTitleLower.includes('progress');
      if (isProgressColumn && (!activeTracker || activeTracker.taskId !== draggableId)) {
        // Only start if not already tracking this task
        setTimeout(() => {
          startTracking(draggableId);
        }, 0);
        activityMsg += ` (timer auto-started)`;
      }

      logActivity(activeProject.id, activityMsg);
    }
  };

  // Disconnect from UI
  const clearAllData = () => {
    setProjects([]);
    setActiveProjectId('');
    localStorage.removeItem('vibe_kanban_active_id');
  };

  // Gather all unique tags from active project tasks for filtering lists
  const allTags = activeProject 
    ? Array.from(
        new Set(
          Object.values(activeProject.tasks || {}).flatMap(task => task.tags || [])
        )
      )
    : [];

  return (
    <BoardContext.Provider
      value={{
        projects,
        isProjectsLoading,
        fetchError,
        activeProjectId,
        activeProject,
        searchQuery,
        setSearchQuery,
        filterPriority,
        setFilterPriority,
        filterTag,
        setFilterTag,
        allTags,
        
        activeTask,
        setActiveTask,
        isTaskModalOpen,
        setIsTaskModalOpen,
        editingTask,
        setEditingTask,
        activeColumnId,
        setActiveColumnId,
        
        isProjectModalOpen,
        setIsProjectModalOpen,
        editingProject,
        setEditingProject,
        
        isShareModalOpen,
        setIsShareModalOpen,
        isAiModalOpen,
        setIsAiModalOpen,
        
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        
        isProfileModalOpen,
        setIsProfileModalOpen,
        
        isProjectSettingsModalOpen,
        setIsProjectSettingsModalOpen,
        
        isArchiveModalOpen,
        setIsArchiveModalOpen,
        
        selectProject: setActiveProjectId,
        addProject,
        addProjectAsync,
        editProject,
        deleteProject,
        inviteMember,
        
        addColumn,
        editColumn,
        deleteColumn,
        
        addTask,
        editTask,
        deleteTask,
        
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        
        handleDragEnd,
        clearAllData,
        updateProjectState,
        
        activeTracker,
        startTracking,
        stopTracking,
        viewingUserProfile,
        setViewingUserProfile,
        logActivity,
        allUsers,
        
        archiveTask,
        unarchiveTask,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};
