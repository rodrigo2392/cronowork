import React, { useState } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { useTranslation } from "../context/LanguageContext";
import { useBoard } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";

const PROJECT_ICONS = [
  "Layers",
  "Rocket",
  "Compass",
  "Smile",
  "Flame",
  "Code",
  "CheckSquare",
  "Sparkles",
];

export default function Onboarding() {
  const { t } = useTranslation();
  const { addProjectAsync } = useBoard();
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Rocket");
  const [prefix, setPrefix] = useState("");
  const [prefixEdited, setPrefixEdited] = useState(false);

  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddEmail = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cleanEmail = emailInput.trim().toLowerCase();
      if (cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        if (!emails.includes(cleanEmail)) {
          setEmails([...emails, cleanEmail]);
        }
        setEmailInput("");
      }
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmails(emails.filter((em) => em !== emailToRemove));
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      // Create Project
      const newProject = await addProjectAsync(
        name.trim(),
        description.trim(),
        selectedIcon,
        prefix.trim()
      );

      // Invite users if any
      if (emails.length > 0 && token && newProject?.id) {
        for (const email of emails) {
          await fetch(
            `http://localhost:3500/projects/${newProject.id}/invite`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ email }),
            },
          );
        }
      }
      // Reload the page or just let BoardContext state sync take over
      // BoardContext already sets activeProjectId and projects array
      // App.jsx will automatically unmount this component since projects.length > 0
    } catch (err) {
      console.error("Error during onboarding:", err);
      alert("Error creating project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "var(--bg-primary)",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "560px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.2 }}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--accent-color), var(--accent-hover))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              color: "white",
              boxShadow: "var(--glow-indigo)",
            }}
          >
            <Icons.Rocket size={32} />
          </motion.div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {t("onboarding.welcome")}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {t("onboarding.subtitle")}
          </p>
        </div>

        {/* Form Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Step 1 */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--accent-color)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("onboarding.step1")}
            </h3>

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
                {t("onboarding.projectName")}
              </label>
              <input
                type="text"
                placeholder="Ej. SaaS Launch"
                value={name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setName(newName);
                  if (!prefixEdited) {
                    setPrefix(newName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase());
                  }
                }}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

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
                {t("modal.project.prefix") || "Prefijo de tareas (opcional)"}
              </label>
              <input
                type="text"
                placeholder={t("modal.project.prefix_ph") || "Ej. PRJ"}
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value.toUpperCase());
                  setPrefixEdited(true);
                }}
                maxLength={6}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

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
                {t("onboarding.projectDesc")}
              </label>
              <textarea
                placeholder={t("modal.project.desc.placeholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
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
                        padding: "10px",
                        borderRadius: "var(--radius-md)",
                        border: isSelected
                          ? "1px solid var(--accent-color)"
                          : "1px solid var(--border-color)",
                        backgroundColor: isSelected
                          ? "var(--accent-light)"
                          : "var(--bg-tertiary)",
                        color: isSelected
                          ? "var(--accent-color)"
                          : "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-color)",
              margin: "8px 0",
            }}
          />

          {/* Step 2 */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--accent-color)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("onboarding.step2")}
            </h3>

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
                {t("onboarding.emails")}
              </label>
              <input
                type="email"
                placeholder="colleague@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddEmail}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Email Tags */}
            {emails.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {emails.map((email) => (
                  <span
                    key={email}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      backgroundColor: "rgba(99, 102, 241, 0.08)",
                      color: "var(--accent-color)",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                    }}
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-color)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "1px",
                      }}
                    >
                      <Icons.X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "14px",
            borderRadius: "var(--radius-md)",
            border: "none",
            backgroundColor: !name.trim()
              ? "var(--bg-tertiary)"
              : "var(--accent-color)",
            color: !name.trim() ? "var(--text-muted)" : "#ffffff",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: !name.trim() || loading ? "not-allowed" : "pointer",
            boxShadow: !name.trim() ? "none" : "var(--glow-indigo)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? (
            <>
              <Icons.Loader2 size={18} className="spin" />
              {t("onboarding.creatingBtn")}
            </>
          ) : (
            <>
              {t("onboarding.createBtn")}
              <Icons.ArrowRight size={18} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
