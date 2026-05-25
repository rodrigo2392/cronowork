import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoard } from '../context/BoardContext';
import { useTranslation } from '../context/LanguageContext';
import * as Icons from 'lucide-react';

const PROJECT_ICONS = [
  'Layers',
  'Rocket',
  'Compass',
  'Smile',
  'Flame',
  'Code',
  'CheckSquare',
  'Sparkles',
];

export default function ProjectModal() {
  const {
    isProjectModalOpen,
    setIsProjectModalOpen,
    editingProject,
    addProject,
    editProject,
  } = useBoard();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Layers');
  const [prefix, setPrefix] = useState('');
  const [prefixEdited, setPrefixEdited] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || '');
      setDescription(editingProject.description || '');
      setSelectedIcon(editingProject.icon || 'Layers');
      setPrefix(editingProject.prefix || '');
      setPrefixEdited(true);
    } else {
      setName('');
      setDescription('');
      setSelectedIcon('Layers');
      setPrefix('');
      setPrefixEdited(false);
    }
  }, [editingProject, isProjectModalOpen]);

  const generatePrefix = (projectName) => {
    if (!projectName) return '';
    // Toma los primeros 4 caracteres alfanuméricos del nombre completo (sin espacios)
    return projectName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (!prefixEdited) {
      setPrefix(generatePrefix(newName));
    }
  };

  const handlePrefixChange = (e) => {
    setPrefix(e.target.value.toUpperCase());
    setPrefixEdited(true);
  };

  if (!isProjectModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      editProject(editingProject.id, name.trim(), description.trim(), selectedIcon, prefix.trim().toUpperCase());
    } else {
      addProject(name.trim(), description.trim(), selectedIcon, prefix.trim().toUpperCase());
    }
    setIsProjectModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsProjectModalOpen(false)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '460px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 101,
            padding: '28px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {editingProject ? t('modal.project.edit') : t('modal.project.create')}
            </h2>
            <button
              onClick={() => setIsProjectModalOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Icons.X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Project Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.project.name')}
              </label>
              <input
                type="text"
                placeholder={t('modal.project.name_ph') || 'Ej. SaaS Landing Page...'}
                value={name}
                onChange={handleNameChange}
                required
                autoFocus
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Project Prefix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.project.prefix')}
              </label>
              <input
                type="text"
                placeholder={t('modal.project.prefix_ph')}
                value={prefix}
                onChange={handlePrefixChange}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Project Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.project.desc')}
              </label>
              <textarea
                placeholder={t('modal.project.desc_ph') || 'Breve resumen del objetivo de este proyecto...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Icon Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.project.icon')}
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
                {PROJECT_ICONS.map((iconName) => {
                  const Icon = Icons[iconName] || Icons.Folder;
                  const isSelected = selectedIcon === iconName;
                  
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '1px solid var(--accent-color)'
                          : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                        color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                paddingTop: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {t('modal.project.cancel')}
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: 'var(--glow-indigo)',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-color)')}
              >
                {editingProject ? t('modal.project.save') : t('modal.project.create_btn')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
