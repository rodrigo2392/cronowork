import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Code2, Bot, Layers, Zap, Sun, Moon } from 'lucide-react';
import '../styles/LandingPage.css';

export default function LandingPage({ onNavigateToAuth }) {
  const [theme, setTheme] = useState(localStorage.getItem('vibe_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vibe_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const features = [
    {
      icon: <Bot size={24} style={{ color: "var(--priority-critical)" }} />,
      title: "IA Autónoma",
      description: "Delega tareas, refactorización y planeación a agentes de IA que interactúan con tu tablero.",
      isLarge: true
    },
    {
      icon: <Layers size={24} style={{ color: "var(--accent-color)" }} />,
      title: "Model Context Protocol",
      description: "Conexión bidireccional para un contexto rico y ejecución de comandos directos.",
      isLarge: false
    },
    {
      icon: <Zap size={24} style={{ color: "var(--priority-medium)" }} />,
      title: "Rápido y Fluido",
      description: "Actualizaciones en tiempo real y soporte avanzado para edición Markdown sin latencia.",
      isLarge: false
    },
    {
      icon: <Code2 size={24} style={{ color: "var(--completed-color)" }} />,
      title: "100% Open Source",
      description: "Modifica, mejora y adapta el entorno Kanban a las necesidades de tu equipo sin restricciones.",
      isLarge: true
    }
  ];

  return (
    <div className="landing-container">
      {/* Background Elements */}
      <div className="landing-bg"></div>
      <div className="glow-center"></div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Layers className="landing-logo-icon" size={28} />
          Cronowork
        </div>
        <div className="landing-nav-links">
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="landing-nav-link">
            GitHub
          </a>
          <button onClick={onNavigateToAuth} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <motion.div variants={itemVariants} className="open-source-badge">
            <Github size={16} /> Orgullosamente Open Source
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            El Kanban diseñado para <br />
            <span>Agentes de IA</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Un entorno de trabajo autónomo donde tú defines los objetivos y la IA interactúa directamente con tus proyectos mediante comandos estructurados.
          </motion.p>
          
          <motion.div variants={itemVariants} className="hero-actions">
            <button onClick={onNavigateToAuth} className="btn-primary">
              Comenzar gratis <ArrowRight size={18} />
            </button>
            <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <Github size={18} /> Ver repositorio
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Bento Box */}
      <section className="features-section">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Un nuevo paradigma de productividad
        </motion.h2>
        
        <motion.div 
          className="bento-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className={`bento-card ${feature.isLarge ? 'bento-large' : ''}`}>
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Author Section */}
      <section className="author-section">
        <motion.div 
          className="author-card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src="https://avatars.githubusercontent.com/u/91278835?v=4" 
            alt="Rodrigo" 
            className="author-avatar"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
              e.target.style.backgroundColor = "var(--bg-secondary)";
              e.target.style.padding = "20px";
            }}
          />
          <h2 className="author-name">Rodrigo</h2>
          <a href="https://github.com/rodrigo2392" target="_blank" rel="noopener noreferrer" className="author-handle">
            @rodrigo2392
          </a>
          <p className="author-bio">
            Desarrollador y creador de Cronowork. Apasionado por la inteligencia artificial, la productividad y el software libre. Construí este proyecto para explorar cómo los agentes autónomos pueden colaborar en interfaces estructuradas.
          </p>
          <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <Github size={18} /> Seguir el proyecto
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Cronowork. Lanzado bajo licencia Open Source.</p>
      </footer>
    </div>
  );
}
