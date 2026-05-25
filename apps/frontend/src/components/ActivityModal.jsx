import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import * as Icons from 'lucide-react';
import DOMPurify from 'dompurify';

export default function ActivityModal() {
  const { 
    viewingUserProfile, setViewingUserProfile, 
    projects, allUsers,
    selectProject, setEditingTask, setIsTaskModalOpen, setActiveColumnId
  } = useBoard();
  const { t, locale } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'comments'

  // Find user details
  const targetUser = useMemo(() => {
    if (!viewingUserProfile) return null;
    return allUsers.find(u => u.email === viewingUserProfile) || { email: viewingUserProfile, name: viewingUserProfile.split('@')[0] };
  }, [viewingUserProfile, allUsers]);

  // Aggregate Tasks
  const assignedTasks = useMemo(() => {
    if (!viewingUserProfile || !projects) return [];
    let tasks = [];
    projects.forEach(proj => {
      Object.values(proj.tasks || {}).forEach(task => {
        if (task.assignee === viewingUserProfile) {
          tasks.push({ ...task, projectName: proj.name, projectId: proj.id });
        }
      });
    });
    return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [viewingUserProfile, projects]);

  // Aggregate Comments
  const userComments = useMemo(() => {
    if (!viewingUserProfile || !targetUser || !projects) return [];
    let commentsList = [];
    projects.forEach(proj => {
      Object.values(proj.tasks || {}).forEach(task => {
        (task.comments || []).forEach(comment => {
          if (comment.userId === targetUser._id || comment.userName === targetUser.name) {
            commentsList.push({
              ...comment,
              taskTitle: task.title,
              taskId: task.id,
              projectName: proj.name,
              projectId: proj.id
            });
          }
        });
      });
    });
    return commentsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [viewingUserProfile, projects, targetUser]);

  if (!viewingUserProfile) return null;

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    try {
      const rtf = new Intl.RelativeTimeFormat(locale || "es", { numeric: "auto" });
      if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second");
      if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
      if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
      if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
      return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
    } catch (e) {
      return date.toLocaleDateString();
    }
  };

  const handleOpenTask = (projectId, taskId) => {
    selectProject(projectId);
    const proj = projects.find(p => p.id === projectId);
    if (proj && proj.tasks[taskId]) {
      let columnId = null;
      for (const [colId, col] of Object.entries(proj.columns || {})) {
        if (col.taskIds && col.taskIds.includes(taskId)) {
          columnId = colId;
          break;
        }
      }
      if (columnId) {
        setActiveColumnId(columnId);
      }
      setEditingTask(proj.tasks[taskId]);
      setIsTaskModalOpen(true);
      setViewingUserProfile(null); // Close modal to focus on task
    }
  };

  const displayName = targetUser?.name || targetUser?.email.split('@')[0];

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            width: '100%',
            maxWidth: '450px',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            <button
              onClick={() => setViewingUserProfile(null)}
              style={{
                position: 'absolute',
                top: '16px', right: '16px',
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                padding: '8px', borderRadius: '50%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Icons.X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                backgroundColor: 'var(--accent-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 'bold', color: '#fff'
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>{displayName}</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{targetUser?.email}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px' }}>
            <button
              onClick={() => setActiveTab('tasks')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '16px 0',
                marginRight: '24px',
                color: activeTab === 'tasks' ? 'var(--accent-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'tasks' ? '2px solid var(--accent-color)' : '2px solid transparent',
                fontWeight: activeTab === 'tasks' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Icons.CheckSquare size={16} />
              Tareas ({assignedTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '16px 0',
                color: activeTab === 'comments' ? 'var(--accent-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'comments' ? '2px solid var(--accent-color)' : '2px solid transparent',
                fontWeight: activeTab === 'comments' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Icons.MessageSquare size={16} />
              Actividad ({userComments.length})
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {activeTab === 'tasks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assignedTasks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>No tiene tareas asignadas.</p>
                ) : (
                  assignedTasks.map(task => (
                    <div key={task.id} style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600 }}>{task.projectName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(task.createdAt)}</span>
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{task.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          backgroundColor: `var(--priority-${task.priority || 'medium'})`
                        }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          Prioridad {task.priority || 'media'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {userComments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>No hay actividad reciente.</p>
                ) : (
                  userComments.map(comment => (
                    <div key={comment.id} style={{
                      display: 'flex', gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                      }}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{displayName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            comentó en: <button onClick={() => handleOpenTask(comment.projectId, comment.taskId)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}>{comment.taskId}</button>
                          </span>
                        </div>
                        <div className="quill-content" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Hace {timeAgo(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
