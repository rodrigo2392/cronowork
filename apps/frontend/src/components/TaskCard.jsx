import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { useBoard } from "../context/BoardContext";
import { useTranslation } from "../context/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import * as Icons from "lucide-react";

export default function TaskCard({ task, index, columnId }) {
  const { setEditingTask, setIsTaskModalOpen, setActiveColumnId, deleteTask, activeTracker } = useBoard();
  const { t, locale } = useTranslation();
  const { confirm } = useConfirm();

  const handleCardClick = () => {
    setActiveColumnId(columnId);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation(); // Prevent opening modal
    const isConfirmed = await confirm({
      title: t('task.delete_title') || 'Delete Task',
      message: `${t('task.delete_confirm')} "${task.title}"?`,
      confirmText: t('task.delete_title') || 'Delete',
      cancelText: t('modal.project.cancel') || 'Cancel',
      isDanger: true
    });
    if (isConfirmed) {
      deleteTask(columnId, task.id);
    }
  };

  // Subtask progress calculations
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;
  const hasSubtasks = totalSubtasks > 0;

  const isOverdue = () => {
    if (!task.dueDate) return false;
    if (columnId.includes("done")) return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const timeAgo = (dateString, loc = "es") => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return loc === 'es' ? "hace un momento" : "just now";
    if (minutes < 60) return loc === 'es' ? `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}` : `${minutes} min ago`;
    if (hours < 24) return loc === 'es' ? `hace ${hours} hora${hours !== 1 ? 's' : ''}` : `${hours} hours ago`;
    if (days < 7) return loc === 'es' ? `hace ${days} día${days !== 1 ? 's' : ''}` : `${days} days ago`;
    return date.toLocaleDateString(loc === 'es' ? 'es-ES' : 'en-US');
  };

  const getPriorityLabel = (prio) => {
    switch (prio) {
      case "critical":
        return t('task.prio_critical');
      case "high":
        return t('task.prio_high');
      case "medium":
        return t('task.prio_medium');
      case "low":
        return t('task.prio_low');
      default:
        return prio;
    }
  };

  const isCurrentlyTracking = activeTracker?.taskId === task.id;
  const totalTrackedTime = (task.timeLogs || []).reduce((acc, log) => acc + log.duration, 0);
  const showTracker = totalTrackedTime > 0 || isCurrentlyTracking;

  const formatTimeCompact = (totalSeconds) => {
    if (!totalSeconds) return "0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            outline: "none",
          }}
        >
          <div style={{ paddingBottom: "12px" }}>
            <div
              onClick={handleCardClick}
              className={`task-card ${snapshot.isDragging ? "dragging-card" : ""}`}
              style={{
                padding: "16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              cursor: snapshot.isDragging ? "grabbing" : "grab",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              position: "relative",
              userSelect: "none",
              transition:
                "border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              if (!snapshot.isDragging) {
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                const btn = e.currentTarget.querySelector(".card-delete-btn");
                if (btn) btn.style.opacity = "1";
              }
            }}
            onMouseLeave={(e) => {
              if (!snapshot.isDragging) {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                const btn = e.currentTarget.querySelector(".card-delete-btn");
                if (btn) btn.style.opacity = "0";
              }
            }}
          >
            {/* Card Header: Priority & Tags */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span className={`badge badge-${task.priority}`}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: `var(--priority-${task.priority})`,
                      display: "inline-block",
                    }}
                  />
                  {getPriorityLabel(task.priority)}
                </span>

                {task.tags &&
                  task.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        color: "var(--accent-color)",
                        padding: "2px 8px",
                        borderRadius: "99px",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      <span style={{ opacity: 0.6, fontWeight: "normal" }}>#</span>
                      {tag}
                    </span>
                  ))}
                {task.storyPoints !== undefined && task.storyPoints !== null && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      backgroundColor: "rgba(99, 102, 241, 0.1)",
                      color: "var(--accent-color)",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    {task.storyPoints} SP
                  </span>
                )}
              </div>

              {/* Quick delete (hidden until hover) */}
              <button
                className="card-delete-btn"
                onClick={handleDeleteClick}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  opacity: 0,
                  transition: "all var(--transition-fast)",
                  display: "flex",
                  alignItems: "center",
                  padding: "6px",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--priority-high)";
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title={t('task.delete_title')}
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Task Info */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <h4
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 500,
                  color: columnId.includes("done")
                    ? "var(--text-secondary)"
                    : "var(--text-primary)",
                  textDecoration: columnId.includes("done")
                    ? "line-through"
                    : "none",
                  lineHeight: "1.3",
                }}
              >
                {task.title}
              </h4>
              {task.description && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: "1.4",
                  }}
                >
                  {task.description.replace(/<[^>]*>?/gm, '')}
                </p>
              )}
            </div>

            {/* Checklist progress bar */}
            {hasSubtasks && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Icons.CheckSquare
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{t('task.subtasks')}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "99px",
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      backgroundColor:
                        completedSubtasks === totalSubtasks
                          ? "var(--completed-color)"
                          : "var(--accent-color)",
                      width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Footer details */}
            {(task.dueDate || columnId.includes("done") || showTracker || task.assignee) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "4px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.02)",
                  paddingTop: "8px",
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {task.dueDate && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: isOverdue()
                          ? "var(--priority-high)"
                          : "var(--text-secondary)",
                        fontWeight: isOverdue() ? 600 : 400,
                      }}
                    >
                      <Icons.Calendar size={14} />
                      <span>
                        {task.dueDate} {isOverdue() && t('task.overdue')}
                      </span>
                    </div>
                  )}

                  {showTracker && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: isCurrentlyTracking ? "var(--priority-high)" : "var(--text-secondary)",
                        fontWeight: isCurrentlyTracking ? 600 : 500,
                      }}
                      title={t("task.time_logged") || "Tiempo registrado"}
                    >
                      <Icons.Clock size={14} className={isCurrentlyTracking ? "pulse-animation" : ""} />
                      <span>{formatTimeCompact(totalTrackedTime)}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {columnId.includes("done") && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "var(--completed-color)",
                        backgroundColor: "var(--completed-bg)",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <Icons.Check size={12} />
                      {t('task.done')}
                    </span>
                  )}
                  {task.assignee && (
                    <div
                      title={task.assignee}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {task.assignee.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Metrics Footer */}
            {(task.tokensConsumed || task.model || task.timeSpent || task.cost) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "6px",
                  paddingTop: "6px",
                  borderTop: "1px dashed rgba(168, 85, 247, 0.2)",
                  fontSize: "0.68rem",
                  color: "#a855f7",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.Sparkles size={12} />
                  <span style={{ fontWeight: 500 }}>{task.model || "IA"}</span>
                </div>
                <span style={{ color: "rgba(168, 85, 247, 0.7)" }}>
                  {task.updatedAt ? (locale === 'es' ? 'Actualizado ' : 'Updated ') + timeAgo(task.updatedAt, locale) : (task.createdAt ? (locale === 'es' ? 'Creado ' : 'Created ') + timeAgo(task.createdAt, locale) : "")}
                </span>
              </div>
            )}
              </div>
            </div>
          </div>
      )}
    </Draggable>
  );
}
