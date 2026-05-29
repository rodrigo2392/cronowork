import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const {
    projects,
    activeProjectId,
    selectProject,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setIsProjectModalOpen,
    setEditingProject,
  } = useBoard();

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <>
      {isMobile && !isSidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      <motion.aside
        className="glass"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          borderRight: '1px solid var(--border-color)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}
        initial={false}
        animate={
          isMobile
            ? { x: isSidebarCollapsed ? '-100%' : '0%', width: 260 }
            : { x: '0%', width: isSidebarCollapsed ? 72 : 260 }
        }
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
      {/* Sidebar Header */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/favicon.svg"
                  alt="Cronowork Logo"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'contain',
                  }}
                />
                <span style={{ fontWeight: 600, letterSpacing: '0.5px', fontSize: '1.05rem' }}>
                  Cronowork
                </span>
              </div>
              {isMobile && (
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Icons.X size={20} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.img
              key="logo-small"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              src="/favicon.svg"
              alt="Cronowork Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'contain',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Projects List Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {!isSidebarCollapsed && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-muted)',
              paddingLeft: '10px',
              marginBottom: '6px',
            }}
          >
            {t('sidebar.projects')}
          </span>
        )}

        {projects.map((project) => {
          const isActive = project.id === activeProjectId;
          
          // Resolve Icon Dynamically
          const IconComponent = Icons[project.icon] || Icons.Folder;

          return (
            <button
              key={project.id}
              onClick={() => {
                selectProject(project.id);
                if (isMobile) {
                  setIsSidebarCollapsed(true);
                }
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                transition: 'color var(--transition-fast)',
              }}
              className="project-tab-btn"
            >
              {/* Dynamic sliding selection background */}
              {isActive && (
                <motion.div
                  layoutId="activeProjectBg"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--accent-light)',
                    borderLeft: '3px solid var(--accent-color)',
                    borderRadius: 'var(--radius-md)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                />
              )}

              <div
                style={{
                  color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconComponent size={20} />
              </div>

              {!isSidebarCollapsed && (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                  }}
                  title={project.name}
                >
                  {project.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Action */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <button
          onClick={handleNewProject}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-color)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Icons.Plus size={20} />
          {!isSidebarCollapsed && <span>{t('sidebar.new_project')}</span>}
        </button>

        {/* Collapse toggle button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {isSidebarCollapsed ? <Icons.ChevronRight size={20} /> : <Icons.ChevronLeft size={20} />}
          {!isSidebarCollapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
      </div>
    </motion.aside>
    </>
  );
}
