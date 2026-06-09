import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from './LanguageContext';
import { useSocket } from './SocketContext';
import { API_URL } from '../config';

// Resolves a project's "completed" column: the explicit doneColumnId when it
// still points to a real column, otherwise the last column in columnOrder.
export const resolveDoneColumnId = (project) => {
  if (!project || !project.columnOrder || project.columnOrder.length === 0) return null;
  if (project.doneColumnId && project.columns && project.columns[project.doneColumnId]) {
    return project.doneColumnId;
  }
  return project.columnOrder[project.columnOrder.length - 1];
};

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

  const { socket } = useSocket();

  // Create a reusable fetch function for the current user's projects
  const refreshProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
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
        setProjects([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError(true);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [token]);

  // Listen for socket events to refresh projects automatically
  useEffect(() => {
    if (socket) {
      socket.on('project_updated', (data) => {
        refreshProjects();
      });

      return () => {
        socket.off('project_updated');
      };
    }
  }, [socket, refreshProjects]);

  // Fetch from backend on mount
  useEffect(() => {
    if (!token) {
      setIsProjectsLoading(false);
      setAllUsers([]);
      return;
    }

    setIsProjectsLoading(true);
    setFetchError(false);

    // Fetch all users for assigning tasks
    fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllUsers(data);
      })
      .catch(err => console.error("Could not fetch users:", err));
      
    refreshProjects();
  }, [token, refreshProjects]);

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
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  
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

  // Process a share link (?join=<token>): join the project once, then swap the
  // URL to ?project=<id> and open it. Runs only once we're authenticated.
  const [joinHandled, setJoinHandled] = useState(false);
  useEffect(() => {
    if (!token || joinHandled) return;
    const joinToken = new URLSearchParams(window.location.search).get('join');
    if (!joinToken) return;
    setJoinHandled(true);

    (async () => {
      const url = new URL(window.location.href);
      try {
        const res = await fetch(`${API_URL}/projects/join/${joinToken}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const joined = await res.json();
          await refreshProjects();
          setActiveProjectId(joined.id);
          url.searchParams.delete('join');
          url.searchParams.set('project', joined.id);
        } else {
          url.searchParams.delete('join'); // invalid / revoked link
        }
      } catch (err) {
        console.error('Failed to join via share link:', err);
        url.searchParams.delete('join');
      }
      window.history.replaceState({}, '', url.toString());
    })();
  }, [token, joinHandled, refreshProjects]);

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

  // Current user's access role on the active project: 'owner' | 'editor' | 'viewer'.
  // Owner is implicit; members default to 'editor' when they have no explicit role.
  const myRole = (!activeProject || !user)
    ? 'editor'
    : (activeProject.userId === user.id
        ? 'owner'
        : ((activeProject.roles && activeProject.roles[user.email]) || 'editor'));
  const isReadOnly = myRole === 'viewer';
  // Owner and admins can manage members/roles; only the owner can delete.
  const canManageMembers = myRole === 'owner' || myRole === 'admin';

  const saveTimeoutRef = useRef(null);

  // Update specific project in projects array and sync to backend
  const updateProjectState = (updatedProject) => {
    if (isReadOnly) return; // Read-only members cannot mutate the project
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    // Debounce the backend save to prevent spamming during rapid edits or drags
    if (!token) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`${API_URL}/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProject)
      }).catch(err => console.error('Failed to sync update to backend:', err));
    }, 1500);
  };

  // Builds a single activity-log entry, reused for both optimistic local state
  // and the server-side move payload so they stay consistent.
  const makeActivity = (text) => ({
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    time: new Date().toISOString(),
  });

  // Optimistically updates local state and persists a *minimal* move to the
  // backend (only affected columns/tasks/columnOrder), instead of re-sending
  // the whole project. Avoids "request entity too large" on large boards.
  const persistMove = (updatedProject, movePayload) => {
    if (isReadOnly) return; // Read-only members cannot mutate the project
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    if (!token) return;
    fetch(`${API_URL}/projects/${updatedProject.id}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(movePayload),
    }).catch(err => console.error('Failed to sync move to backend:', err));
  };

  // Activity Logger helper
  const logActivity = (projectId, text) => {
    const newActivity = makeActivity(text);

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
      fetch(`${API_URL}/projects`, {
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
      const response = await fetch(`${API_URL}/projects`, {
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
      fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.error('Failed to delete project on backend:', err));
    }
  };

  const inviteMember = async (projectId, email, role = 'editor') => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) throw new Error("Project not found");
    const currentMembers = proj.members || [];
    if (currentMembers.includes(email)) throw new Error("already_member");

    if (token) {
      const response = await fetch(`${API_URL}/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role })
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
        members: [...currentMembers, email],
        roles: { ...(proj.roles || {}), [email]: role === 'viewer' ? 'viewer' : 'editor' }
      };
      updateProjectState(updated);
      logActivity(projectId, `Invited ${email} to project (Local)`);
    }
  };

  // Owner-only: change a member's access role ('editor' | 'viewer').
  const setMemberRole = async (projectId, email, role) => {
    if (!token) return;
    const response = await fetch(`${API_URL}/projects/${projectId}/members/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, role })
    });
    if (!response.ok) throw new Error("generic");
    const updatedProject = await response.json();
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  // --- Share link (owner/admin) ---
  // Enable/update the shareable link. Only patches share fields onto local
  // state so the de-duplicated columns from refreshProjects aren't clobbered.
  const createShareLink = async (projectId, role = 'editor') => {
    if (!token) return null;
    const response = await fetch(`${API_URL}/projects/${projectId}/share-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error("generic");
    const updated = await response.json();
    setProjects(prev => prev.map(p => p.id === projectId
      ? { ...p, shareToken: updated.shareToken, shareRole: updated.shareRole }
      : p));
    return updated;
  };

  const revokeShareLink = async (projectId) => {
    if (!token) return;
    const response = await fetch(`${API_URL}/projects/${projectId}/share-link`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("generic");
    const updated = await response.json();
    setProjects(prev => prev.map(p => p.id === projectId
      ? { ...p, shareToken: updated.shareToken, shareRole: updated.shareRole }
      : p));
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

    const archivedAt = new Date().toISOString();
    const updatedTask = {
      ...task,
      archived: true,
      archivedAt
    };

    const activity = makeActivity(`Archived task "${task.title}"`);
    const updatedProject = {
      ...activeProject,
      tasks: {
        ...activeProject.tasks,
        [taskId]: updatedTask
      },
      columns: updatedColumns,
      activityLog: [activity, ...(activeProject.activityLog || [])].slice(0, 50),
    };

    const movePayload = {
      taskUpdates: { [taskId]: { archived: true, archivedAt } },
      activity,
    };
    if (sourceColumnId && updatedColumns[sourceColumnId]) {
      movePayload.columns = { [sourceColumnId]: updatedColumns[sourceColumnId].taskIds };
    }
    persistMove(updatedProject, movePayload);
  };

  const unarchiveTask = (taskId) => {
    if (!activeProject || !activeProject.columnOrder.length) return;
    const task = activeProject.tasks[taskId];
    if (!task) return;

    // Restore to the completed column by default
    const destColumnId = resolveDoneColumnId(activeProject);
    const destCol = activeProject.columns[destColumnId];
    if (!destCol) return;

    const updatedTask = { ...task };
    delete updatedTask.archived;
    delete updatedTask.archivedAt;

    const newDestTaskIds = [...destCol.taskIds, taskId];
    const activity = makeActivity(`Unarchived task "${task.title}"`);
    const updatedProject = {
      ...activeProject,
      tasks: {
        ...activeProject.tasks,
        [taskId]: updatedTask
      },
      columns: {
        ...activeProject.columns,
        [destColumnId]: { ...destCol, taskIds: newDestTaskIds }
      },
      activityLog: [activity, ...(activeProject.activityLog || [])].slice(0, 50),
    };

    persistMove(updatedProject, {
      columns: { [destColumnId]: newDestTaskIds },
      taskUpdates: { [taskId]: { archived: false, archivedAt: null } },
      activity,
    });
  };

  // --- Auto Archive / Auto Delete Logic ---
  // A periodic tick so a board left open past the threshold still archives,
  // instead of only re-evaluating when the project state happens to change.
  const [archiveTick, setArchiveTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setArchiveTick(t => t + 1), 60 * 60 * 1000); // hourly
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeProject || !activeProject.columnOrder.length) return;

    const now = Date.now();
    let updatedTasks = { ...activeProject.tasks };
    let updatedColumns = { ...activeProject.columns };
    let changed = false;
    const activityMsgs = [];

    // 1) Auto-archive tasks sitting in the done column (if enabled).
    if (activeProject.autoArchiveEnabled !== false) {
      const lastColumnId = resolveDoneColumnId(activeProject);
      const lastColumn = updatedColumns[lastColumnId];
      if (lastColumn && lastColumn.taskIds.length) {
        const archiveMs = (activeProject.autoArchiveDays || 7) * 24 * 60 * 60 * 1000;
        // Eligibility is computed on the fly from the best available timestamp —
        // movedToDoneAt (set when dragged to done) or, when that's missing
        // (task created in the done column, AI-generated, imported, or predating
        // the field), createdAt as a proxy. We deliberately do NOT persist a
        // backfilled movedToDoneAt: writing "now" on first sight would restart
        // the clock and keep already-old tasks visible for a full extra window.
        const toArchive = lastColumn.taskIds.filter(taskId => {
          const task = updatedTasks[taskId];
          if (!task || task.archived) return false;
          const stamp = task.movedToDoneAt || task.createdAt;
          return stamp && (now - new Date(stamp).getTime() > archiveMs);
        });
        if (toArchive.length) {
          updatedColumns[lastColumnId] = {
            ...lastColumn,
            taskIds: lastColumn.taskIds.filter(id => !toArchive.includes(id))
          };
          toArchive.forEach(taskId => {
            updatedTasks[taskId] = { ...updatedTasks[taskId], archived: true, archivedAt: new Date().toISOString() };
            activityMsgs.push(`Auto-archived task "${updatedTasks[taskId].title}"`);
          });
          changed = true;
        }
      }
    }

    // 2) Permanently delete archived tasks older than the configured window.
    const deleteDays = Number(activeProject.autoDeleteArchivedDays) || 0;
    if (deleteDays > 0) {
      const deleteMs = deleteDays * 24 * 60 * 60 * 1000;
      const toDelete = Object.keys(updatedTasks).filter(taskId => {
        const task = updatedTasks[taskId];
        return task && task.archived && task.archivedAt &&
          (now - new Date(task.archivedAt).getTime() > deleteMs);
      });
      if (toDelete.length) {
        toDelete.forEach(taskId => { delete updatedTasks[taskId]; });
        Object.keys(updatedColumns).forEach(colId => {
          const col = updatedColumns[colId];
          if (col && col.taskIds && col.taskIds.some(id => toDelete.includes(id))) {
            updatedColumns[colId] = { ...col, taskIds: col.taskIds.filter(id => !toDelete.includes(id)) };
          }
        });
        activityMsgs.push(`Auto-deleted ${toDelete.length} archived task(s)`);
        changed = true;
      }
    }

    if (changed) {
      updateProjectState({ ...activeProject, tasks: updatedTasks, columns: updatedColumns });
      activityMsgs.forEach(msg => logActivity(activeProject.id, msg));
    }
  }, [activeProject, archiveTick]);

  // --- Drag and Drop Movement Handler ---
  const handleDragEnd = (result) => {
    if (isReadOnly) return; // Read-only members cannot move tasks/columns
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

      const activity = makeActivity(`Reordered columns`);
      const updated = {
        ...activeProject,
        columnOrder: newColumnOrder,
        activityLog: [activity, ...(activeProject.activityLog || [])].slice(0, 50),
      };
      persistMove(updated, { columnOrder: newColumnOrder, activity });
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
      persistMove(updated, { columns: { [sourceCol.id]: newTaskIds } });
    } else {
      // WIP limit: block moving a task into a column that is already at its limit.
      const destWip = Number(destCol.wipLimit) || 0;
      if (destWip > 0 && (destCol.taskIds?.length || 0) >= destWip) {
        return;
      }

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

      const original = activeProject.tasks[draggableId] || {};
      const taskTitle = original.title || 'Task';

      // Build a *minimal* per-task patch — only the fields automations touch.
      const taskPatch = {};

      const isFirstColumn = destCol.id === activeProject.columnOrder[0];
      if (!isFirstColumn && !original.assignee && user?.email) {
        taskPatch.assignee = user.email;
      }

      const isLastColumn = destCol.id === resolveDoneColumnId(activeProject);
      if (isLastColumn) {
        taskPatch.movedToDoneAt = new Date().toISOString();
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
            taskPatch.timeLogs = [...(original.timeLogs || []), newLog];
          }
          setActiveTracker(null);
        }
      } else {
        // If it was moved out of the last column, clear the timestamp.
        taskPatch.movedToDoneAt = null;
      }

      const updatedTaskData = { ...original, ...taskPatch };

      let activityMsg = `Moved "${taskTitle}" from "${sourceCol.title}" to "${destCol.title}"`;
      if (!isFirstColumn && taskPatch.assignee === user?.email && !original.assignee) {
        activityMsg += ` and auto-assigned`;
      }
      if (isLastColumn && activeTracker && activeTracker.taskId === draggableId) {
        activityMsg += ` (timer auto-stopped)`;
      }

      // Auto-start tracker if moved to a "Progreso" / "Progress" column
      const destTitleLower = destCol.title.toLowerCase();
      const isProgressColumn = destTitleLower.includes('progreso') || destTitleLower.includes('progress');
      if (activeProject.autoStartTimer !== false && isProgressColumn && (!activeTracker || activeTracker.taskId !== draggableId)) {
        // Only start if not already tracking this task
        setTimeout(() => {
          startTracking(draggableId);
        }, 0);
        activityMsg += ` (timer auto-started)`;
      }

      const activity = makeActivity(activityMsg);
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
        },
        activityLog: [activity, ...(activeProject.activityLog || [])].slice(0, 50),
      };

      persistMove(updated, {
        columns: {
          [sourceCol.id]: sourceTaskIds,
          [destCol.id]: destTaskIds,
        },
        taskUpdates: { [draggableId]: taskPatch },
        activity,
      });
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
        
        isMcpModalOpen,
        setIsMcpModalOpen,
        
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

        activeDoneColumnId: resolveDoneColumnId(activeProject),
        myRole,
        isReadOnly,
        canManageMembers,
        setMemberRole,
        createShareLink,
        revokeShareLink,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};
