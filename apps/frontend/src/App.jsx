import React from "react";
import { BoardProvider, useBoard } from "./context/BoardContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useTranslation } from "./context/LanguageContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Board from "./components/Board";
import TaskModal from "./components/TaskModal";
import ProjectModal from "./components/ProjectModal";
import ShareModal from "./components/ShareModal";
import AiTaskModal from "./components/AiTaskModal";
import ProfileModal from "./components/ProfileModal";
import ActivityModal from "./components/ActivityModal";
import Onboarding from "./components/Onboarding";
import ProjectSettingsModal from "./components/ProjectSettingsModal";
import ArchiveModal from "./components/ArchiveModal";
import * as Icons from "lucide-react";

function BoardWrapper() {
  const { projects, isProjectsLoading, fetchError, isProfileModalOpen, setIsProfileModalOpen } = useBoard();

  if (isProjectsLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <Icons.Loader2
          size={40}
          className="spin"
          style={{ color: "var(--accent-color)" }}
        />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
          }}
        >
          <Icons.ServerCrash
            size={32}
            style={{ color: "var(--priority-high)" }}
          />
        </div>
        <h2
          style={{
            color: "var(--text-primary)",
            fontSize: "1.4rem",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Despertando el servidor...
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
          Por favor, espera un momento mientras el backend termina de inicializarse.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icons.RefreshCw size={16} />
          Reintentar conexión
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return <Onboarding />;
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Board Planner Panel */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Header />
        <Board />
      </main>

      {/* Global Action Modals */}
      <TaskModal />
      <ProjectModal />
      <ShareModal />
      <AiTaskModal />
      <ActivityModal />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <ProjectSettingsModal />
      <ArchiveModal />
    </div>
  );
}

function MainApp() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (user && token) {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callback");
      if (callbackUrl) {
        setIsRedirecting(true);
        try {
          const url = new URL(callbackUrl);
          url.searchParams.append("token", token);
          setTimeout(() => {
            window.location.href = url.toString();
          }, 1200); // Small delay to show the authorization success message
        } catch (e) {
          console.error("Invalid callback URL provided:", callbackUrl);
          setIsRedirecting(false);
        }
      }
    }
  }, [user, token]);

  if (!user) {
    return <AuthPage />;
  }

  if (isRedirecting) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
          }}
        >
          <Icons.ShieldCheck
            size={32}
            style={{ color: "var(--accent-color)" }}
          />
        </div>
        <h2
          style={{
            color: "var(--text-primary)",
            fontSize: "1.4rem",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          {t("auth.success") || "Autorización Exitosa"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {t("auth.redirecting_desc") ||
            "Redirigiendo de vuelta a la aplicación..."}
        </p>
      </div>
    );
  }

  return (
    <BoardProvider>
      <BoardWrapper />
    </BoardProvider>
  );
}

export default function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("vibe_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <ConfirmProvider>
          <MainApp />
        </ConfirmProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
