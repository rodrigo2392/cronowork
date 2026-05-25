import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoard } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import ProfileModal from "./ProfileModal";

export default function Header() {
  const {
    activeProject,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterTag,
    setFilterTag,
    allTags,
    addColumn,
    setIsProjectModalOpen,
    setEditingProject,
    deleteProject,
    clearAllData,
    setIsShareModalOpen,
    setIsAiModalOpen,
    activeTracker,
    stopTracking,
    setViewingUserProfile,
    setIsProfileModalOpen,
    setIsProjectSettingsModalOpen
  } = useBoard();

  const [newColTitle, setNewColTitle] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("vibe_theme") || "dark",
  );
  const { t, locale, toggleLanguage } = useTranslation();
  const { confirm } = useConfirm();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const { token } = useAuth();

  React.useEffect(() => {
    if (token) {
      fetchNotifications();
      // Polling every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:3500/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:3500/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`http://localhost:3500/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("vibe_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const [sessionTime, setSessionTime] = useState(0);

  React.useEffect(() => {
    let interval;
    if (activeTracker) {
      const calcTime = () => Math.floor((Date.now() - activeTracker.startTime) / 1000);
      setSessionTime(calcTime());
      interval = setInterval(() => {
        setSessionTime(calcTime());
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [activeTracker]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateLiveTime = () => {
    if (!activeTracker || !activeProject) return 0;
    const task = activeProject.tasks[activeTracker.taskId];
    if (!task) return 0;
    const baseTime = (task.timeLogs || []).reduce((acc, log) => acc + log.duration, 0);
    return baseTime + sessionTime;
  };

  if (!activeProject) return null;

  // Calculate project progress
  const totalTasks = Object.keys(activeProject.tasks || {}).length;
  const lastColId =
    activeProject.columnOrder[activeProject.columnOrder.length - 1];
  const doneTasks = lastColId
    ? activeProject.columns[lastColId]?.taskIds.length || 0
    : 0;
  const progress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleAddColumnSubmit = (e) => {
    e.preventDefault();
    if (newColTitle.trim()) {
      addColumn(newColTitle);
      setNewColTitle("");
      setShowAddCol(false);
    }
  };

  const handleEditProject = () => {
    setEditingProject(activeProject);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async () => {
    const isConfirmed = await confirm({
      title: t("header.delete_project"),
      message: `${t("header.confirm_delete_project")} "${activeProject.name}"?`,
      confirmText: t("header.delete_project"),
      cancelText: t("modal.project.cancel") || "Cancel",
      isDanger: true
    });
    if (isConfirmed) {
      deleteProject(activeProject.id);
    }
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: t("header.logout") || "Cerrar sesión",
      message: "¿Seguro que quieres cerrar sesión?",
      confirmText: t("header.logout") || "Cerrar sesión",
      cancelText: t("modal.project.cancel") || "Cancel",
      isDanger: true
    });
    if (isConfirmed) {
      logout();
    }
  };

  const handleResetData = async () => {
    const isConfirmed = await confirm({
      title: t("header.reset"),
      message: t("header.confirm_reset") || "¿Seguro que quieres borrar todos los datos locales?",
      confirmText: t("header.reset") || "Restablecer",
      cancelText: t("modal.project.cancel") || "Cancel",
      isDanger: true
    });
    if (isConfirmed) {
      clearAllData();
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <header
      style={{
        height: "auto",
        minHeight: "var(--header-height)",
        borderBottom: "1px solid var(--border-color)",
        padding: "16px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        backdropFilter: "blur(10px)",
        zIndex: 5,
      }}
    >
      {/* Top Section: Title & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                letterSpacing: "-0.3px",
              }}
            >
              {activeProject.name}
            </h1>
            <button
              onClick={handleEditProject}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={t("header.edit_project")}
            >
              <Icons.Edit3 size={18} />
            </button>
            <button
              onClick={() => setIsProjectSettingsModalOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Ajustes del Proyecto"
            >
              <Icons.Settings size={18} />
            </button>
            <button
              onClick={handleDeleteProject}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--priority-high)";
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={t("header.delete_project")}
            >
              <Icons.Trash2 size={18} />
            </button>
            <button
              onClick={handleResetData}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--priority-high)";
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={t("header.reset")}
            >
              <Icons.RotateCcw size={18} />
            </button>
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              marginTop: "4px",
              maxWidth: "600px",
              lineHeight: "1.4",
            }}
          >
            {activeProject.description}
          </p>
        </div>

        {/* Global actions (Tracker, Share & Avatar) */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
          
          {activeTracker && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', 
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' 
            }}>
              <Icons.Clock size={16} color="var(--priority-high)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }} title={activeTracker.taskTitle}>
                {activeTracker.taskTitle.length > 20 ? activeTracker.taskTitle.substring(0, 20) + '...' : activeTracker.taskTitle}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--priority-high)', fontFamily: 'monospace' }}>
                {formatTime(calculateLiveTime())}
              </span>
              <button 
                onClick={stopTracking} 
                style={{ 
                  background: 'var(--priority-high)', border: 'none', color: '#fff', 
                  borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', 
                  fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' 
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t('task.stop_timer') || 'Detener'}
              </button>
            </div>
          )}

          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "var(--radius-md)",
              color: "var(--accent-color)",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-color)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.color = "var(--accent-color)";
            }}
          >
            <Icons.Share2 size={18} />
            <span>{t("header.share") || "Compartir"}</span>
          </button>

          {/* Avatar Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              title={t("header.notifications") || "Notificaciones"}
            >
              <Icons.Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    backgroundColor: "var(--priority-high)",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "2px solid var(--bg-tertiary)",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifPopover && (
                <>
                  <div
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9 }}
                    onClick={() => setShowNotifPopover(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      width: "320px",
                      maxHeight: "400px",
                      overflowY: "auto",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-lg)",
                      boxShadow: "var(--shadow-lg)",
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      zIndex: 10,
                    }}
                  >
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        {t('header.notifications') || 'Notificaciones'}
                      </p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          style={{
                            background: "none", border: "none", color: "var(--accent-color)",
                            fontSize: "0.75rem", cursor: "pointer", padding: "4px",
                          }}
                        >
                          {t('header.notifications_mark_read') || 'Marcar todas como leídas'}
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {t('header.notifications_empty') || 'No tienes notificaciones.'}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => { if (!notif.read) markAsRead(notif._id); }}
                          style={{
                            padding: "10px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: notif.read ? "transparent" : "rgba(99, 102, 241, 0.1)",
                            cursor: notif.read ? "default" : "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            borderLeft: notif.read ? "3px solid transparent" : "3px solid var(--accent-color)",
                          }}
                        >
                          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: notif.read ? 400 : 600, color: "var(--text-primary)" }}>
                            {notif.title}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {new Date(notif.createdAt).toLocaleString(locale)}
                          </span>
                        </div>
                      ))
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-color), var(--accent-hover))",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "1.05rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            title="Opciones"
          >
            {userInitial}
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div
                  style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9 }}
                  onClick={() => setIsMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: "220px",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-lg)",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    zIndex: 10,
                  }}
                >
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "4px" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{t('header.logged_in_as') || 'Logueado como'}</p>
                    <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.name || t('header.user') || 'Usuario'}
                    </p>
                  </div>

                  <button
                    onClick={() => { 
                      setIsProfileModalOpen(true);
                      setIsMenuOpen(false); 
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                      width: "100%", background: "none", border: "none", borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)", fontSize: "0.9rem", cursor: "pointer", textAlign: "left",
                      transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Icons.User size={18} style={{ color: "var(--text-muted)" }}/>
                    <span>{t("header.profile") || "Mi Perfil"}</span>
                  </button>

                  <button
                    onClick={() => { 
                      if (user?.email) setViewingUserProfile(user.email);
                      setIsMenuOpen(false); 
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                      width: "100%", background: "none", border: "none", borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)", fontSize: "0.9rem", cursor: "pointer", textAlign: "left",
                      transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Icons.Activity size={18} style={{ color: "var(--text-muted)" }}/>
                    <span>Mi Actividad</span>
                  </button>

                  <button
                    onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                      width: "100%", background: "none", border: "none", borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)", fontSize: "0.9rem", cursor: "pointer", textAlign: "left",
                      transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Icons.Globe size={18} style={{ color: "var(--text-muted)" }}/>
                    <span>{locale.toUpperCase()} {t('header.change') ? `(${t('header.change')})` : '(Cambiar)'}</span>
                  </button>

                  <button
                    onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                      width: "100%", background: "none", border: "none", borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)", fontSize: "0.9rem", cursor: "pointer", textAlign: "left",
                      transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {theme === "dark" ? <Icons.Sun size={18} style={{ color: "var(--text-muted)" }}/> : <Icons.Moon size={18} style={{ color: "var(--text-muted)" }}/>}
                    <span>{theme === "dark" ? t("header.light_mode") : t("header.dark_mode")}</span>
                  </button>

                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                      width: "100%", background: "none", border: "none", borderRadius: "var(--radius-md)",
                      color: "var(--priority-high)", fontSize: "0.9rem", cursor: "pointer", textAlign: "left",
                      marginTop: "4px", borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Icons.LogOut size={18} />
                    <span>{t("header.logout") || "Cerrar sesión"}</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* Middle Section: Progress & Filters Grid */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.03)",
          paddingTop: "12px",
        }}
      >
        {/* Left Sub-Section: Progress bar & Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flex: 1,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: "200px",
              maxWidth: "300px",
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {t("header.progress")}
            </span>
            <div
              style={{
                flex: 1,
                height: "6px",
                backgroundColor: "var(--border-color)",
                borderRadius: "9999px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background:
                    progress === 100
                      ? "var(--completed-color)"
                      : "linear-gradient(90deg, var(--accent-color), var(--accent-hover))",
                  borderRadius: "9999px",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                color:
                  progress === 100
                    ? "var(--completed-color)"
                    : "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              {progress}%
            </span>
          </div>

          {/* Search Bar */}
          <div style={{ position: "relative", minWidth: "200px", flex: 1, maxWidth: "350px" }}>
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Icons.Search size={14} />
            </span>
            <input
              type="text"
              placeholder={t("header.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px 7px 32px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.85rem",
                outline: "none",
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent-color)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-color)")
              }
            />
          </div>
        </div>

        {/* Right Sub-Section: Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">{t("header.priority_all")}</option>
            <option value="low">{t("header.priority_low")}</option>
            <option value="medium">{t("header.priority_medium")}</option>
            <option value="high">{t("header.priority_high")}</option>
          </select>

          {/* Tag Filter */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
              maxWidth: "150px",
            }}
          >
            <option value="all">{t("header.tag_all")}</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          {/* AI Task Generator Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "#a855f7",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              boxShadow: "0 0 10px rgba(168, 85, 247, 0.1) inset"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, var(--accent-color), #a855f7)";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(168, 85, 247, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))";
              e.currentTarget.style.color = "#a855f7";
              e.currentTarget.style.boxShadow = "0 0 10px rgba(168, 85, 247, 0.1) inset";
            }}
          >
            <Icons.Sparkles size={18} />
            <span>{t("header.ai_btn") || "Generar Tareas"}</span>
          </button>

          {/* Add Column Button */}
          {showAddCol ? (
            <form
              onSubmit={handleAddColumnSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                animation: "fadeIn var(--transition-fast)",
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder={t("header.add_col_placeholder")}
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--accent-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "7px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  backgroundColor: "var(--accent-color)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                {t("header.add_col_submit")}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCol(false)}
                style={{
                  padding: "7px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icons.X size={14} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddCol(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                backgroundColor: "var(--accent-color)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color var(--transition-fast)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--accent-color)")
              }
            >
              <Icons.Plus size={18} />
              <span>{t("header.add_col_btn")}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
