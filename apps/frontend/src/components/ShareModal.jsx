import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import * as Icons from 'lucide-react';
import { APP_URL } from '../config';

export default function ShareModal() {
  const { isShareModalOpen, setIsShareModalOpen, activeProject, inviteMember, setMemberRole, canManageMembers, allUsers, createShareLink, revokeShareLink } = useBoard();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [emailInput, setEmailInput] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isShareModalOpen || !activeProject) return null;

  const isOwner = activeProject.userId === user?.id;
  const roles = activeProject.roles || {};
  const ownerUser = (allUsers || []).find((u) => u._id === activeProject.userId);
  const roleLabel = (r) =>
    r === 'admin'
      ? (t('modal.share.role_admin') || 'Administrador')
      : r === 'viewer'
        ? (t('modal.share.role_viewer') || 'Lector')
        : (t('modal.share.role_editor') || 'Editor');

  const handleRoleChange = async (email, role) => {
    try {
      await setMemberRole(activeProject.id, email, role);
    } catch (err) {
      setErrorMsg(t("modal.share.error_generic") || "An error occurred");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await inviteMember(activeProject.id, emailInput.trim(), inviteRole);
      setEmailInput('');
    } catch (err) {
      if (err.message === "user_not_found") {
        setErrorMsg(t("modal.share.error_user_not_found") || "User does not exist");
      } else if (err.message === "already_member") {
        setErrorMsg(t("modal.share.error_already_member") || "User is already a member");
      } else {
        setErrorMsg(t("modal.share.error_generic") || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const shareToken = activeProject.shareToken;
  const shareLink = shareToken ? `${APP_URL}/?join=${shareToken}` : '';
  const linkRole = activeProject.shareRole || 'editor';

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runLinkAction = async (action) => {
    setLinkLoading(true);
    setErrorMsg(null);
    try {
      await action();
    } catch (err) {
      setErrorMsg(t('modal.share.error_generic') || 'An error occurred');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleGenerateLink = () => runLinkAction(() => createShareLink(activeProject.id, linkRole));
  const handleLinkRoleChange = (role) => runLinkAction(() => createShareLink(activeProject.id, role));
  const handleRevokeLink = () => runLinkAction(() => revokeShareLink(activeProject.id));

  const members = activeProject.members || [];

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsShareModalOpen(false)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />

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
              {t('modal.share.title') || "Share Project"}
            </h2>
            <button
              onClick={() => setIsShareModalOpen(false)}
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

          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Invite Input (owner/admin only) */}
            {canManageMembers && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.share.email_label') || "Email address"}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder={t('modal.share.email_ph') || "Enter email to invite..."}
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  style={{
                    flex: 1,
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
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="admin">{t('modal.share.role_admin') || 'Administrador'}</option>
                  <option value="editor">{t('modal.share.role_editor') || 'Editor'}</option>
                  <option value="viewer">{t('modal.share.role_viewer') || 'Lector'}</option>
                </select>
                <button
                  type="submit"
                  disabled={!emailInput.trim() || isLoading}
                  style={{
                    padding: '0 16px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: emailInput.trim() && !isLoading ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: emailInput.trim() && !isLoading ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: emailInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (emailInput.trim() && !isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (emailInput.trim() && !isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                  }}
                >
                  {isLoading ? <Icons.Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} /> : t('modal.share.invite_btn') || "Invite"}
                </button>
              </div>
              {errorMsg && (
                <span style={{ fontSize: '0.75rem', color: 'var(--priority-high)', marginTop: '2px' }}>
                  {errorMsg}
                </span>
              )}
            </div>
            )}

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.share.members') || "Project Members"}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {/* Owner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                      {(ownerUser?.name || (isOwner ? user?.name : '') || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{ownerUser?.name || (isOwner ? user?.name : null) || t('header.user')}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{ownerUser?.email || (isOwner ? user?.email : '')}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '99px' }}>
                    {isOwner ? (t('modal.share.owner') || "Propietario (Tú)") : (t('modal.share.owner_role') || "Propietario")}
                  </span>
                </div>

                {/* Invited Members */}
                {members.map((email, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'transparent', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{email.split('@')[0]}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{email}</p>
                      </div>
                    </div>
                    {canManageMembers ? (
                      <select
                        value={roles[email] || 'editor'}
                        onChange={(e) => handleRoleChange(email, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '99px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="admin">{t('modal.share.role_admin') || 'Administrador'}</option>
                        <option value="editor">{t('modal.share.role_editor') || 'Editor'}</option>
                        <option value="viewer">{t('modal.share.role_viewer') || 'Lector'}</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {roleLabel(roles[email] || 'editor')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Link */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '20px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('modal.share.link_label') || 'Invite link'}
              </label>

              {shareLink ? (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      readOnly
                      value={shareLink}
                      onFocus={(e) => e.target.select()}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.8rem',
                        outline: 'none',
                        textOverflow: 'ellipsis',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px',
                        backgroundColor: isCopied ? 'var(--completed-color)' : 'rgba(99, 102, 241, 0.1)',
                        border: isCopied ? '1px solid var(--completed-color)' : '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        color: isCopied ? '#ffffff' : 'var(--accent-color)',
                        fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {isCopied ? <Icons.Check size={14} /> : <Icons.Link size={14} />}
                      <span>{isCopied ? (t('modal.share.copied') || '¡Copiado!') : (t('modal.share.copy_link') || 'Copiar Enlace')}</span>
                    </button>
                  </div>

                  {canManageMembers && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('modal.share.link_role') || 'Role on join:'}</span>
                        <select
                          value={linkRole}
                          disabled={linkLoading}
                          onChange={(e) => handleLinkRoleChange(e.target.value)}
                          style={{
                            padding: '4px 8px', borderRadius: '99px', border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                            fontSize: '0.75rem', outline: 'none', cursor: 'pointer',
                          }}
                        >
                          <option value="admin">{t('modal.share.role_admin') || 'Administrador'}</option>
                          <option value="editor">{t('modal.share.role_editor') || 'Editor'}</option>
                          <option value="viewer">{t('modal.share.role_viewer') || 'Lector'}</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleRevokeLink}
                        disabled={linkLoading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                          backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 'var(--radius-md)', color: 'var(--priority-high)',
                          fontSize: '0.78rem', fontWeight: 500, cursor: linkLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Icons.Link2Off size={14} />
                        <span>{t('modal.share.link_disable') || 'Desactivar enlace'}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {canManageMembers ? (t('modal.share.link_desc') || 'Anyone with the link can join the project with the selected role.') : (t('modal.share.link_disabled') || 'The invite link is disabled.')}
                  </p>
                  {canManageMembers && (
                    <button
                      type="button"
                      onClick={handleGenerateLink}
                      disabled={linkLoading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        marginTop: '4px', padding: '10px 16px',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: 'var(--radius-md)', color: 'var(--accent-color)',
                        fontSize: '0.85rem', fontWeight: 500, cursor: linkLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {linkLoading ? <Icons.Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Icons.Link size={14} />}
                      <span>{t('modal.share.link_generate') || 'Generar enlace'}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                paddingTop: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
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
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
