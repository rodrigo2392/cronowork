import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoard } from "../context/BoardContext";
import { useTranslation } from "../context/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import * as Icons from "lucide-react";
import { API_URL } from "../config";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import QuillMarkdown from "quilljs-markdown";
import { useAuth } from "../context/AuthContext";
import DOMPurify from 'dompurify';

export default function TaskModal() {
  const { t, locale } = useTranslation();
  const { user, token } = useAuth();
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    activeColumnId,
    addTask,
    editTask,
    deleteTask,
    activeTracker,
    startTracking,
    stopTracking,
    projects,
    activeProjectId,
    allUsers,
    setViewingUserProfile,
  } = useBoard();
  const { confirm } = useConfirm();

  // Local state for task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tags, setTags] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [subtasks, setSubtasks] = useState([]);

  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [assignee, setAssignee] = useState("");
  const [mentionState, setMentionState] = useState({ active: false, search: "", target: null });
  
  const quillNewRef = React.useRef(null);
  const quillReplyRef = React.useRef(null);
  
  const attachMarkdown = (el) => {
    if (el) {
      const editor = el.getEditor();
      if (!editor.__markdown_initialized) {
        new QuillMarkdown(editor, {
          // Usamos el patrón por defecto de la librería para no romper el tipeo manual
        });

        const matchBoldTitle = (node, delta) => {
          if (delta.ops && delta.ops.length === 1 && typeof delta.ops[0].insert === 'string') {
            const text = delta.ops[0].insert.trim();
            if (/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]+$/.test(text) || /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+:$/.test(text)) {
              const Delta = Quill.import('delta');
              return new Delta()
                .insert('\n\n')
                .insert(text, { bold: true })
                .insert('\n');
            }
          }
          return delta;
        };

        editor.clipboard.addMatcher('B', matchBoldTitle);
        editor.clipboard.addMatcher('STRONG', matchBoldTitle);

        editor.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
          if (typeof node.data === 'string') {
            const text = node.data;
            const titleRegex = /\*\*([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]+:?|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+:)\*\*/g;
            const codeRegex = /`([^`]+)`/g;
            
            let hasMatch = false;
            let currentText = text;
            const Delta = Quill.import('delta');
            let newDelta = new Delta();
            
            // Si hay títulos en negritas
            if (titleRegex.test(currentText)) {
              hasMatch = true;
              titleRegex.lastIndex = 0;
              let lastIndex = 0;
              let match;
              while ((match = titleRegex.exec(currentText)) !== null) {
                if (match.index > lastIndex) {
                  // A las partes que no son títulos, les aplicaremos la búsqueda de código
                  const unformattedPart = currentText.substring(lastIndex, match.index);
                  const subDelta = processCodeRegex(unformattedPart, codeRegex, Delta);
                  newDelta = newDelta.concat(subDelta);
                }
                newDelta.insert('\n\n');
                newDelta.insert(match[1], { bold: true });
                newDelta.insert('\n');
                lastIndex = titleRegex.lastIndex;
              }
              if (lastIndex < currentText.length) {
                const unformattedPart = currentText.substring(lastIndex);
                const subDelta = processCodeRegex(unformattedPart, codeRegex, Delta);
                newDelta = newDelta.concat(subDelta);
              }
            } else {
              // No hay títulos, buscar solo código
              if (codeRegex.test(currentText)) {
                hasMatch = true;
                codeRegex.lastIndex = 0;
                newDelta = processCodeRegex(currentText, codeRegex, Delta);
              }
            }
            
            if (hasMatch) {
              console.log("TEXT_NODE delta resultante:", JSON.stringify(newDelta.ops));
              return newDelta;
            }
          }
          return delta;
        });

        function processCodeRegex(text, regex, Delta) {
          const delta = new Delta();
          regex.lastIndex = 0;
          let lastIndex = 0;
          let match;
          while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
              delta.insert(text.substring(lastIndex, match.index));
            }
            delta.insert(match[1], { code: true });
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < text.length) {
            delta.insert(text.substring(lastIndex));
          }
          return delta;
        }

        // Elimina colores arbitrarios (como el naranja o verde) al pegar HTML de otras fuentes (ej. el chat)
        editor.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
          let newDelta = delta;
          
          // Primero, procesamos el texto combinado de todos los hijos para ver si hay comillas invertidas divididas en múltiples nodos (ej. spans de color de sintaxis)
          const Delta = Quill.import('delta');
          let text = '';
          newDelta.ops.forEach(op => {
            if (typeof op.insert === 'string') {
              text += op.insert;
            } else {
              text += '\0';
            }
          });

          const codeRegex = /`([^`]+)`/g;
          if (codeRegex.test(text)) {
            codeRegex.lastIndex = 0;
            let modifier = new Delta();
            let lastIndex = 0;
            let match;

            while ((match = codeRegex.exec(text)) !== null) {
              const matchIndex = match.index;
              if (matchIndex > lastIndex) {
                modifier.retain(matchIndex - lastIndex);
              }
              modifier.delete(1);
              modifier.retain(match[1].length, { code: true });
              modifier.delete(1);
              lastIndex = matchIndex + match[0].length;
            }
            newDelta = newDelta.compose(modifier);
          }

          // Ahora limpiamos los colores y forzamos el código si el nodo actual era explícitamente código
          newDelta.ops.forEach(op => {
            if (op.attributes) {
              delete op.attributes.color;
              delete op.attributes.background;
            }
          });
          
          const isCodeSpan = node.tagName === 'SPAN' && 
            (node.classList.contains('markdown-code') || 
             node.classList.contains('hljs') || 
             (node.style && node.style.fontFamily && node.style.fontFamily.includes('mono')));
             
          if (isCodeSpan || node.tagName === 'CODE') {
            newDelta.ops.forEach(op => {
              op.attributes = op.attributes || {};
              op.attributes.code = true;
            });
          }

          return newDelta;
        });

        editor.__markdown_initialized = true;
      }
    }
  };

  // Manual Time Tracker State
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");

  const activeProj = projects.find(p => p.id === activeProjectId);
  const liveTask = editingTask ? (activeProj?.tasks[editingTask.id] || editingTask) : null;

  const handleAddManualTime = () => {
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const totalSeconds = (h * 3600) + (m * 60);
    if (totalSeconds > 0 && liveTask) {
      const newLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user?.id || "anon",
        userName: user?.name || "Usuario",
        duration: totalSeconds,
        createdAt: new Date().toISOString()
      };
      const currentLogs = liveTask.timeLogs || [];
      editTask(liveTask.id, { timeLogs: [...currentLogs, newLog] });
      setManualHours("");
      setManualMinutes("");
    }
  };

  const handleDeleteTimeLog = async (logId) => {
    if (!liveTask) return;
    const isConfirmed = await confirm({
      title: t("task.delete_title") || "Eliminar registro",
      message: "¿Estás seguro de que deseas eliminar este registro de tiempo?",
      confirmText: t("task.delete_title") || "Eliminar",
      cancelText: t("modal.task.cancel") || "Cancelar",
      isDanger: true,
    });
    
    if (isConfirmed) {
      const updatedLogs = (liveTask.timeLogs || []).filter(log => log.id !== logId);
      editTask(liveTask.id, { timeLogs: updatedLogs });
    }
  };

  const canDeleteLog = (log) => {
    if (!user) return false;
    if (log.userId === user.id) return true;
    const activeProj = projects.find(p => p.id === activeProjectId);
    if (activeProj && activeProj.userId === user.id) return true; // owner
    return false;
  };

  const formatTimeCompact = (totalSeconds) => {
    if (!totalSeconds) return "0h 0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatTimeLive = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [sessionTime, setSessionTime] = useState(0);

  // Update states when modal opens/editingTask changes
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setDescription(editingTask.description || "");
      setPriority(editingTask.priority || "medium");
      setTags(editingTask.tags || []);
      setDueDate(editingTask.dueDate || "");
      setSubtasks(editingTask.subtasks || []);
      setComments(editingTask.comments || []);
      setAssignee(editingTask.assignee || "");
    } else if (isTaskModalOpen) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTags([]);
      setDueDate("");
      setSubtasks([]);
      setComments([]);
      setAssignee("");
    }
  }, [editingTask, isTaskModalOpen]);

  useEffect(() => {
    const handleMentionClick = (e) => {
      const target = e.target.closest('.mention-link');
      if (target) {
        e.preventDefault();
        const email = target.getAttribute('data-email');
        if (email) {
          setViewingUserProfile(email);
        }
      }
    };
    document.addEventListener('click', handleMentionClick);
    return () => document.removeEventListener('click', handleMentionClick);
  }, [setViewingUserProfile]);

  useEffect(() => {
    if (!isTaskModalOpen) {
      setCopiedLink(false);
      setAssignee("");
      setPriority("medium");
      setTags([]);
      setDueDate("");
      setSubtasks([]);
      setComments([]);
      setAssignee("");
    }
    setTagInput("");
    setSubtaskInput("");
    setNewComment("");
    setReplyingTo(null);
    setReplyContent("");
    setManualHours("");
    setManualMinutes("");
    setIsEditingTitle(false);
    setIsEditingDesc(false);
    setCopiedLink(false);
  }, [editingTask, isTaskModalOpen]);

  const formatHtmlTitles = (html) => {
    if (!html) return html;
    let formatted = html;
    
    // Divide el párrafo exactamente donde haya un título en negritas, sin importar su posición
    formatted = formatted.replace(/<strong>([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]+:?)<\/strong>/g, 
      '</p><p><br></p><p><strong>$1</strong></p><p>'
    );
    formatted = formatted.replace(/<strong>([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+:)<\/strong>/g, 
      '</p><p><br></p><p><strong>$1</strong></p><p>'
    );
    
    // Limpia etiquetas <p> vacías que se hayan generado al inicio o en medio
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    
    return formatted;
  };

  const handleQuickSave = (field, value) => {
    if (!editingTask) return;
    let finalValue = value;
    if (field === 'description') {
       finalValue = formatHtmlTitles(value);
       setDescription(finalValue);
    }
    editTask(editingTask.id, { [field]: finalValue });
  };

  // Handle live timer
  useEffect(() => {
    let interval;
    if (activeTracker && liveTask && activeTracker.taskId === liveTask.id) {
      const calcTime = () => Math.floor((Date.now() - activeTracker.startTime) / 1000);
      setSessionTime(calcTime());
      interval = setInterval(() => {
        setSessionTime(calcTime());
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [activeTracker, liveTask]);

  if (!isTaskModalOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Auto-flush any pending tag input before saving
    let finalTags = [...tags];
    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!finalTags.includes(newTag)) {
        finalTags.push(newTag);
      }
      setTagInput("");
    }

    const taskData = {
      title: title.trim(),
      description: formatHtmlTitles(description.trim()),
      priority,
      tags: finalTags,
      dueDate,
      subtasks,
      comments,
      assignee,
    };

    if (editingTask) {
      editTask(editingTask.id, taskData);
      if (assignee && assignee !== editingTask.assignee) {
        notifyAssignee(assignee, taskData.title);
      }
    } else {
      addTask(activeColumnId, taskData);
      if (assignee) {
        notifyAssignee(assignee, taskData.title);
      }
    }
    setIsTaskModalOpen(false);
  };

  const notifyAssignee = async (targetEmail, taskTitle) => {
    if (!token || !targetEmail || targetEmail === user?.email) return;
    try {
      await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetEmail: targetEmail,
          title: "Nueva tarea asignada",
          message: `Te han asignado la tarea: "${taskTitle}" en el proyecto "${activeProj?.name}"`,
          type: "ASSIGN",
          projectId: activeProjectId,
          taskId: editingTask?.id || "new"
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const notifyMention = async (targetEmail, taskTitle) => {
    if (!token || !targetEmail || targetEmail === user?.email) return;
    try {
      await fetch("http://localhost:3500/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetEmail: targetEmail,
          title: t("notification.mention_title") || "Has sido mencionado",
          message: `${t("notification.mention_desc") || "Te han mencionado en un comentario de la tarea"} "${taskTitle}" en el proyecto "${activeProj?.name}"`,
          type: "MENTION",
          projectId: activeProjectId,
          taskId: editingTask?.id || "new"
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (!editingTask) return;
    const url = new URL(window.location.href);
    url.searchParams.set('project', activeProjectId);
    url.searchParams.set('task', editingTask.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDelete = async () => {
    if (editingTask) {
      const isConfirmed = await confirm({
        title: t("task.delete_title") || "Delete Task",
        message: `${t("task.delete_confirm")}?`,
        confirmText: t("task.delete_title") || "Delete",
        cancelText: t("modal.task.cancel") || "Cancel",
        isDanger: true,
      });
      if (isConfirmed) {
        deleteTask(activeColumnId, editingTask.id);
        setIsTaskModalOpen(false);
      }
    }
  };

  const timeAgo = (dateString, loc = "es") => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    try {
      const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
      if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second");
      if (diffInSeconds < 3600)
        return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
      if (diffInSeconds < 86400)
        return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
      if (diffInSeconds < 2592000)
        return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
      return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
    } catch (e) {
      return date.toLocaleDateString();
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!editingTask) return;
    const isConfirmed = await confirm({
      title: "Eliminar Comentario",
      message: "¿Estás seguro de que deseas eliminar este comentario?",
      confirmText: "Eliminar",
      cancelText: t("modal.task.cancel") || "Cancelar",
      isDanger: true,
    });
    
    if (isConfirmed) {
      // Filter out the comment and its direct replies
      const updatedComments = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
      setComments(updatedComments);
      editTask(editingTask.id, { comments: updatedComments });
    }
  };

  const canDeleteComment = (comment) => {
    if (!user) return false;
    if (comment.userId === user.id) return true; // Creator
    const activeProj = projects.find(p => p.id === activeProjectId);
    if (activeProj && activeProj.userId === user.id) return true; // Project Owner
    return false;
  };

  const handlePostComment = (parentId = null) => {
    const content = parentId ? replyContent : newComment;
    const stripped = content.replace(/<[^>]*>?/gm, "").trim();
    if (!stripped) return;

    const newCommentObj = {
      id: `com-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user?.id || "anon",
      userName: user?.name || "Usuario",
      content,
      createdAt: new Date().toISOString(),
      parentId,
    };

    const updatedComments = [...comments, newCommentObj];
    setComments(updatedComments);

    if (editingTask) {
      editTask(editingTask.id, { comments: updatedComments });
    }

    // --- Mentions logic ---
    const words = stripped.split(/\s+/);
    const mentions = words.filter(w => w.startsWith('@') && w.length > 1).map(w => w.substring(1).toLowerCase());
    
    if (mentions.length > 0) {
      const uniqueMentions = [...new Set(mentions)];
      const searchPool = allUsers && allUsers.length > 0 ? allUsers : [user, ...(activeProj?.members || []).map(m => ({ email: m }))];
      
      uniqueMentions.forEach(mentionStr => {
        const targetUser = searchPool.find(u => {
          if (!u) return false;
          const nameMatch = u.name && u.name.toLowerCase().startsWith(mentionStr);
          const emailMatch = u.email && u.email.split('@')[0].toLowerCase().startsWith(mentionStr);
          return nameMatch || emailMatch;
        });
        
        if (targetUser && targetUser.email !== user?.email) {
          notifyMention(targetUser.email, title);
        }
      });
    }

    if (parentId) {
      setReplyingTo(null);
      setReplyContent("");
      setMentionState({ active: false, search: "", target: null });
    } else {
      setNewComment("");
      setMentionState({ active: false, search: "", target: null });
    }
  };

  const handleCommentChange = (content, setContent, target) => {
    setContent(content);
    const stripped = content.replace(/<[^>]*>?/gm, "");
    // Agregamos compatibilidad con el caracter cero o espacio normal
    // y miramos si la última palabra empieza por @
    const match = stripped.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionState({ active: true, search: match[1].toLowerCase(), target });
    } else {
      setMentionState({ active: false, search: "", target: null });
    }
  };

  const handleMentionSelect = (targetUser, setContent) => {
    const search = mentionState.search;
    const name = targetUser.name || targetUser.email.split('@')[0];
    
    // Insert just bold text in the editor, no link.
    const styledMention = `<strong style="color: var(--accent-color); font-weight: 600;">@${name}</strong>&nbsp;`;
    
    const replaceRegex = new RegExp(`@${search}(<[^>]*>)*$`, 'i');
    setContent(prev => prev.replace(replaceRegex, `${styledMention}$1`));
    
    const isReply = mentionState.target === 'reply';
    setMentionState({ active: false, search: "", target: null });

    // Move cursor to end of the editor after React processes the state update
    setTimeout(() => {
      const quill = isReply ? quillReplyRef.current?.getEditor() : quillNewRef.current?.getEditor();
      if (quill) {
        quill.setSelection(quill.getLength(), 0);
      }
    }, 10);
  };

  const renderMentionsList = (setContent) => {
    if (!mentionState.active) return null;
    const searchPool = allUsers && allUsers.length > 0 ? allUsers : [user, ...(activeProj?.members || []).map(m => ({ email: m }))];
    
    // Remove duplicates by email
    const uniqueUsers = [];
    const seenEmails = new Set();
    searchPool.forEach(u => {
      if (u && u.email && !seenEmails.has(u.email)) {
        seenEmails.add(u.email);
        uniqueUsers.push(u);
      }
    });

    const filtered = uniqueUsers.filter(u => {
      const n = u.name ? u.name.toLowerCase() : "";
      const e = u.email ? u.email.split('@')[0].toLowerCase() : "";
      return n.startsWith(mentionState.search) || e.startsWith(mentionState.search);
    });

    if (filtered.length === 0) return null;

    return (
      <div style={{
        marginTop: "4px",
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        maxHeight: "150px",
        overflowY: "auto",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10
      }}>
        {filtered.map(u => {
          const displayName = u.name || u.email.split('@')[0];
          return (
            <button
              key={u.email}
              type="button"
              onClick={() => handleMentionSelect(u, setContent)}
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.85rem",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-secondary)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--accent-color)", 
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold"
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>{displayName}</span>
                {u.name && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{u.email}</span>}
              </div>
            </button>
          )
        })}
      </div>
    );
  };

  const formatCommentContent = (htmlContent) => {
    let formatted = htmlContent;
    const searchPool = allUsers && allUsers.length > 0 ? allUsers : [user, ...(activeProj?.members || []).map(m => ({ email: m }))];
    
    // Sort users by name length descending to avoid partial matches (e.g. matching "Juan" inside "Juanita")
    const sortedPool = [...searchPool].sort((a, b) => {
      const nameA = a?.name || a?.email?.split('@')[0] || '';
      const nameB = b?.name || b?.email?.split('@')[0] || '';
      return nameB.length - nameA.length;
    });

    sortedPool.forEach(u => {
      if (!u || !u.email) return;
      const name = u.name || u.email.split('@')[0];
      // Regex to find @name outside of existing tags if possible, or just globally
      const regex = new RegExp(`@${name}\\b`, 'gi');
      formatted = formatted.replace(regex, `<span class="mention-link" data-email="${u.email}" style="color: var(--accent-color); font-weight: 600; cursor: pointer; text-decoration: underline;">@${name}</span>`);
    });
    return formatted;
  };

  const renderComments = (parentId = null, depth = 0) => {
    return comments
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((comment) => (
        <div
          key={comment.id}
          style={{
            marginLeft: depth > 0 ? "16px" : "0",
            marginTop: "12px",
            borderLeft: depth > 0 ? "2px solid var(--border-color)" : "none",
            paddingLeft: depth > 0 ? "12px" : "0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "var(--accent-color)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              {comment.userName?.charAt(0).toUpperCase() || "U"}
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {comment.userName}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {timeAgo(comment.createdAt, locale)}
            </span>
          </div>

          <div
            className="quill-content"
            style={{ 
              fontSize: "0.85rem", 
              color: "var(--text-secondary)",
              padding: "8px 0 12px 0", // Added padding top and bottom
              lineHeight: "1.5"
            }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatCommentContent(comment.content)) }}
          />

          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setReplyingTo(comment.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-color)",
                cursor: "pointer",
                fontSize: "0.75rem",
                marginTop: "4px",
                padding: 0,
              }}
            >
              {t("task.reply") || "Responder"}
            </button>
            
            {canDeleteComment(comment) && (
              <button
                type="button"
                onClick={() => handleDeleteComment(comment.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--priority-high)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
              >
                Eliminar
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <ReactQuill
                ref={(el) => {
                  quillReplyRef.current = el;
                  attachMarkdown(el);
                }}
                theme="snow"
                value={replyContent}
                onChange={(content) => handleCommentChange(content, setReplyContent, 'reply')}
                placeholder={t("task.comment_ph") || "Escribe un comentario..."}
                formats={['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image', 'code-block', 'code']}
              />
              {mentionState.target === 'reply' && renderMentionsList(setReplyContent)}
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "4px" }}>
                {t("task.mention_tip") || "💡 Tip: Escribe @Nombre para mencionar a alguien."}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  {t("modal.task.cancel") || "Cancelar"}
                </button>
                <button
                  type="button"
                  onClick={() => handlePostComment(comment.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: "var(--accent-color)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  {t("task.send") || "Enviar"}
                </button>
              </div>
            </div>
          )}

          {renderComments(comment.id, depth + 1)}
        </div>
      ));
  };

  // Tag helpers
  const handleTagInputChange = (e) => {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      const newTags = [...tags];
      for (let i = 0; i < parts.length - 1; i++) {
        const t = parts[i].trim().toLowerCase();
        if (t && !newTags.includes(t)) {
          newTags.push(t);
        }
      }
      setTags(newTags);
      setTagInput(parts[parts.length - 1].trimStart());
    } else {
      setTagInput(val);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase();
      if (!tags.includes(cleanTag)) {
        const newTags = [...tags, cleanTag];
        setTags(newTags);
        if (editingTask) handleQuickSave("tags", newTags);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    if (editingTask) handleQuickSave("tags", newTags);
  };

  // Subtask helpers
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (subtaskInput.trim()) {
      const newSub = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        text: subtaskInput.trim(),
        completed: false,
      };
      const newSubtasks = [...subtasks, newSub];
      setSubtasks(newSubtasks);
      setSubtaskInput("");
      if (editingTask) handleQuickSave("subtasks", newSubtasks);
    }
  };

  const handleToggleSubtask = (subId) => {
    const newSubtasks = subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s,
    );
    setSubtasks(newSubtasks);
    if (editingTask) handleQuickSave("subtasks", newSubtasks);
  };

  const handleRemoveSubtask = (subId) => {
    const newSubtasks = subtasks.filter((s) => s.id !== subId);
    setSubtasks(newSubtasks);
    if (editingTask) handleQuickSave("subtasks", newSubtasks);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsTaskModalOpen(false)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            position: "relative",
            width: "90%",
            maxWidth: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 101,
            padding: "28px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {editingTask ? (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: copiedLink ? "var(--completed-color)" : "var(--accent-color)",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.textDecoration = "none";
                  }}
                  title={t('task.copy_link') || "Copiar enlace directo"}
                >
                  {copiedLink ? <Icons.Check size={16} /> : <Icons.Link size={16} />}
                  #{editingTask.id}
                </button>
              ) : (
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  {t("modal.task.create")}
                </h2>
              )}
              
              {/* Copied Link Toast */}
              <AnimatePresence>
                {copiedLink && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--completed-color)",
                      fontWeight: 500,
                      marginLeft: "8px"
                    }}
                  >
                    {t("task.link_copied") || "Link copiado"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <Icons.X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Title */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {!editingTask && (
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  {t("modal.task.title")}
                </label>
              )}
              {editingTask && !isEditingTitle ? (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    margin: 0,
                    cursor: "text",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    border: "1px solid transparent",
                    transition: "background 0.2s",
                    color: "var(--text-primary)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {title || "Sin título"}
                </h2>
              ) : (
                <input
                  type="text"
                  placeholder={t("modal.task.title_ph")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (editingTask) {
                      setIsEditingTitle(false);
                      if (title.trim() !== editingTask.title) {
                        handleQuickSave("title", title.trim() || "Sin título");
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editingTask) {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  required={!editingTask}
                  autoFocus={isEditingTitle}
                  style={{
                    padding: editingTask ? "8px 12px" : "10px 12px",
                    fontSize: editingTask ? "1.2rem" : "0.9rem",
                    fontWeight: editingTask ? 600 : 400,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--accent-color)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                {t("modal.task.desc")}
              </label>
              {editingTask && !isEditingDesc ? (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="quill-content"
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid transparent",
                    minHeight: "60px",
                    cursor: "text",
                    fontSize: "0.9rem",
                    color: description ? "var(--text-primary)" : "var(--text-muted)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) || t("modal.task.desc_ph") }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <ReactQuill
                    ref={attachMarkdown}
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder={t("modal.task.desc_ph")}
                    formats={['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image', 'code-block', 'code']}
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--accent-color)"
                    }}
                  />
                  {editingTask && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDesc(false);
                          if (description !== editingTask.description) {
                            handleQuickSave("description", description);
                          }
                        }}
                        style={{
                          padding: "6px 12px", borderRadius: "4px", border: "none",
                          background: "var(--accent-color)", color: "#fff", cursor: "pointer", fontSize: "0.8rem"
                        }}
                      >
                        {t("task.done") || "Listo"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Priority Selector (Premium design) */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {t("modal.task.priority")}
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "10px",
                }}
              >
                {["low", "medium", "high", "critical"].map((prio) => {
                  const isActive = priority === prio;
                  const label =
                    prio === "low"
                      ? t("task.prio_low")
                      : prio === "medium"
                        ? t("task.prio_medium")
                        : prio === "high"
                          ? t("task.prio_high")
                          : t("task.prio_critical");

                  let activeBorder = "var(--border-color)";
                  let activeBg = "transparent";
                  if (isActive) {
                    if (prio === "low") {
                      activeBorder = "var(--priority-low)";
                      activeBg = "var(--priority-low-bg)";
                    } else if (prio === "medium") {
                      activeBorder = "var(--priority-medium)";
                      activeBg = "var(--priority-medium-bg)";
                    } else if (prio === "high") {
                      activeBorder = "var(--priority-high)";
                      activeBg = "var(--priority-high-bg)";
                    } else {
                      activeBorder = "var(--priority-critical)";
                      activeBg = "var(--priority-critical-bg)";
                    }
                  }

                  return (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => {
                        setPriority(prio);
                        if (editingTask && priority !== prio) {
                          handleQuickSave("priority", prio);
                        }
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${activeBorder}`,
                        backgroundColor: isActive
                          ? activeBg
                          : "var(--bg-tertiary)",
                        color: isActive
                          ? `var(--priority-${prio})`
                          : "var(--text-secondary)",
                        fontSize: "0.85rem",
                        fontWeight: isActive ? 600 : 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: `var(--priority-${prio})`,
                        }}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date & Assignee Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {/* Assignee */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  {t("modal.task.assignee") || "Responsable"}
                </label>
                <select
                  value={assignee}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignee(val);
                    if (editingTask && val !== assignee) {
                      handleQuickSave("assignee", val);
                      notifyAssignee(val, title);
                    }
                  }}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                >
                  <option value="">{t("task.unassigned") || "Sin asignar"}</option>
                  {allUsers && allUsers.length > 0 
                    ? allUsers.map(u => (
                        <option key={u.email} value={u.email}>
                          {u.email} {u.name ? `(${u.name})` : ''}
                        </option>
                      ))
                    : Array.from(new Set([
                        ...(user?.email ? [user.email] : []), 
                        ...(activeProj?.members || [])
                      ])).map(email => (
                        <option key={email} value={email}>{email}</option>
                      ))
                  }
                </select>
              </div>
              {/* Due Date */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {t("modal.task.duedate")}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDueDate(val);
                    if (editingTask && val !== dueDate) {
                      handleQuickSave("dueDate", val);
                    }
                  }}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>


            {/* Dedicated Time Tracker Section */}
            {liveTask && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                  paddingTop: "16px",
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("task.time_tracker") || "Registro de Tiempo"}
                  </label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Total: {formatTimeCompact((liveTask.timeLogs || []).reduce((acc, log) => acc + log.duration, 0))}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Start/Stop Timer Button */}
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    {activeTracker?.taskId === liveTask.id ? (
                      <button
                        type="button"
                        onClick={stopTracking}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600, fontSize: '0.85rem', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--priority-high)', background: 'var(--priority-high)', justifyContent: 'center', cursor: 'pointer', width: '100%' }}
                        title={t("task.stop_timer")}
                      >
                        <Icons.Square size={14} fill="currentColor" />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', marginLeft: '4px' }}>
                          {formatTimeLive((liveTask.timeLogs || []).reduce((acc, log) => acc + log.duration, 0) + sessionTime)}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startTracking(liveTask.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 12px', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--accent-color)', background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.85rem', width: '100%', justifyContent: 'center', fontWeight: 500
                        }}
                      >
                        <Icons.Play size={14} />
                        {t("task.start_timer") || "Iniciar Reloj"}
                      </button>
                    )}
                  </div>

                  {/* Manual Time Entry */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+ Manual:</span>
                    <input
                      type="number"
                      placeholder="H"
                      min="0"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      style={{
                        width: '45px', padding: '4px 6px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '-4px' }}>h</span>
                    
                    <input
                      type="number"
                      placeholder="M"
                      min="0"
                      max="59"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      style={{
                        width: '45px', padding: '4px 6px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '-4px' }}>m</span>

                    <button
                      type="button"
                      onClick={handleAddManualTime}
                      disabled={(!manualHours && !manualMinutes) || (manualHours === "0" && manualMinutes === "0")}
                      style={{
                        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                        border: 'none', background: (!manualHours && !manualMinutes) || (manualHours === "0" && manualMinutes === "0") ? 'var(--bg-tertiary)' : 'var(--accent-color)', color: (!manualHours && !manualMinutes) || (manualHours === "0" && manualMinutes === "0") ? 'var(--text-muted)' : '#fff',
                        cursor: (!manualHours && !manualMinutes) || (manualHours === "0" && manualMinutes === "0") ? 'not-allowed' : 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', marginLeft: '4px', transition: 'background-color 0.2s'
                      }}
                      title="Añadir tiempo"
                    >
                      <Icons.Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Time Logs List */}
                {(liveTask.timeLogs || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {/* Copy the array to avoid mutating the prop, then sort and map */}
                    {[...liveTask.timeLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{log.userName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>hace {timeAgo(log.createdAt, locale)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-color)' }}>{formatTimeCompact(log.duration)}</span>
                          {canDeleteLog(log) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTimeLog(log.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                              title="Eliminar registro"
                            >
                              <Icons.Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtasks Checklist */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                paddingTop: "16px",
              }}
            >
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {t("modal.task.subtasks")}
              </label>

              {/* Subtask Input Form */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder={t("modal.task.subtask_ph")}
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    backgroundColor: "var(--accent-light)",
                    color: "var(--accent-color)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icons.Plus size={16} />
                </button>
              </div>

              {/* Subtask list */}
              {subtasks.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    marginTop: "4px",
                    paddingRight: "4px",
                  }}
                >
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255, 255, 255, 0.01)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(sub.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: sub.completed
                            ? "var(--completed-color)"
                            : "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          textAlign: "left",
                          flex: 1,
                        }}
                      >
                        {sub.completed ? (
                          <Icons.CheckSquare size={16} />
                        ) : (
                          <Icons.Square size={16} />
                        )}
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: sub.completed
                              ? "var(--text-secondary)"
                              : "var(--text-primary)",
                            textDecoration: sub.completed
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {sub.text || sub.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--priority-high)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
                      >
                        <Icons.Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            {editingTask && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                  paddingTop: "16px",
                }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {t("task.comments") || "Comentarios"}
                </label>

                {/* Render Comments */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginBottom: "12px",
                  }}
                >
                  {renderComments(null, 0)}
                  {comments.length === 0 && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {t("task.no_comments") || "No hay comentarios aún."}
                    </p>
                  )}
                </div>

                {/* New Comment Input */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <ReactQuill
                    ref={(el) => {
                      quillNewRef.current = el;
                      attachMarkdown(el);
                    }}
                    theme="snow"
                    value={newComment}
                    onChange={(content) => handleCommentChange(content, setNewComment, 'new')}
                    placeholder={t("task.comment_ph") || "Escribe un comentario..."}
                    formats={['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image', 'code-block', 'code']}
                  />
                  {mentionState.target === 'new' && renderMentionsList(setNewComment)}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {t("task.mention_tip") || "💡 Tip: Escribe @Nombre para mencionar a alguien."}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePostComment(null)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        background: "var(--accent-color)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                      }}
                    >
                      {t("task.comment_btn") || "Comentar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tags Input (Moved to bottom) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.03)", paddingTop: "16px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                {t("modal.task.tags")}
              </label>
              <input
                type="text"
                placeholder={t("modal.task.tags_ph")}
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleAddTag}
                style={{
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              {/* Render active tags */}
              {tags.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        color: "var(--accent-color)",
                        padding: "4px 10px",
                        borderRadius: "99px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <span>
                        <span style={{ opacity: 0.6, fontWeight: "normal", marginRight: "2px" }}>#</span>
                        {tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-color)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}
                      >
                        <Icons.X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: editingTask ? "space-between" : "flex-end",
                alignItems: "center",
                marginTop: "12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                paddingTop: "20px",
              }}
            >
              {editingTask && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    backgroundColor: "rgba(239, 68, 68, 0.02)",
                    color: "var(--priority-high)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--priority-high-bg)";
                    e.currentTarget.style.borderColor = "var(--priority-high)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(239, 68, 68, 0.02)";
                    e.currentTarget.style.borderColor =
                      "rgba(239, 68, 68, 0.2)";
                  }}
                >
                  <Icons.Trash2 size={14} />
                  <span>{t("modal.task.delete")}</span>
                </button>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                  >
                    {t("modal.task.close") || "Cerrar"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(false)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-hover)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-color)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {t("modal.task.cancel")}
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 22px",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        backgroundColor: "var(--accent-color)",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        boxShadow: "var(--glow-indigo)",
                        transition: "background-color var(--transition-fast)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--accent-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--accent-color)")
                      }
                    >
                      {t("modal.task.create_btn")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
