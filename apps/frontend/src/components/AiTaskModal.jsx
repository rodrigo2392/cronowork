import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoard } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import * as Icons from "lucide-react";

export default function AiTaskModal() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { isAiModalOpen, setIsAiModalOpen, activeProject, updateProjectState } = useBoard();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isAiModalOpen) {
      setPrompt("");
      setIsGenerating(false);
    }
  }, [isAiModalOpen]);

  if (!isAiModalOpen || !activeProject) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch('http://localhost:3500/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          projectId: activeProject.id
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Error al conectar con la Inteligencia Artificial');
      }

      const data = await response.json();
      
      if (data.project) {
        updateProjectState(data.project);
      }
      
      setPrompt("");
      setIsAiModalOpen(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(`Oops: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isGenerating && setIsAiModalOpen(false)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            position: "relative",
            width: "90%",
            maxWidth: "540px",
            borderRadius: "var(--radius-lg)",
            background:
              "linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: "0 0 40px rgba(168, 85, 247, 0.15)",
            zIndex: 101,
            padding: "28px",
            overflow: "hidden",
          }}
        >
          {/* Decorative glow */}
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: "var(--accent-color)",
              filter: "blur(80px)",
              opacity: 0.25,
              zIndex: -1,
              borderRadius: "50%",
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--accent-color), #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(168, 85, 247, 0.4)",
                }}
              >
                <Icons.Sparkles size={22} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {t("modal.ai.title") || "Generar Tareas con IA"}
                </h2>
              </div>
            </div>

            <button
              onClick={() => !isGenerating && setIsAiModalOpen(false)}
              disabled={isGenerating}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: isGenerating ? "not-allowed" : "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                opacity: isGenerating ? 0.5 : 1,
              }}
            >
              <Icons.X size={18} />
            </button>
          </div>

          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              marginBottom: "24px",
              lineHeight: 1.5,
            }}
          >
            {t("modal.ai.subtitle") ||
              "Describe lo que necesitas construir y la Inteligencia Artificial desglosará el trabajo en tareas accionables."}
          </p>

          <form
            onSubmit={handleGenerate}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <textarea
                placeholder={
                  t("modal.ai.prompt_ph") ||
                  "Ej: Crea las tareas para desarrollar el sistema de login usando JWT y React..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                rows={5}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem",
                  outline: "none",
                  resize: "vertical",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#a855f7";
                  e.target.style.boxShadow =
                    "0 0 0 2px rgba(168, 85, 247, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(168, 85, 247, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isGenerating}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  opacity: isGenerating ? 0.5 : 1,
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  !isGenerating &&
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)")
                }
                onMouseLeave={(e) =>
                  !isGenerating &&
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {t("modal.ai.cancel") || "Cancelar"}
              </button>

              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--accent-color), #a855f7)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor:
                    isGenerating || !prompt.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isGenerating || !prompt.trim() ? 0.7 : 1,
                  boxShadow: "0 4px 16px rgba(168, 85, 247, 0.4)",
                  transition: "transform 0.1s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && prompt.trim()) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(168, 85, 247, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating && prompt.trim()) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(168, 85, 247, 0.4)";
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <Icons.Loader2 size={16} className="spin" />
                    <span>{t("modal.ai.generating") || "Pensando..."}</span>
                  </>
                ) : (
                  <>
                    <Icons.Wand2 size={16} />
                    <span>{t("modal.ai.generate") || "Generar Tareas"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
