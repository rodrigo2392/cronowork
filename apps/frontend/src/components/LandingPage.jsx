import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Code2, Bot, Layers, Zap } from 'lucide-react';
import '../styles/LandingPage.css';

export default function LandingPage({ onNavigateToAuth }) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      icon: <Bot size={28} style={{ color: "#6366f1" }} />,
      title: "IA Autónoma Integrada",
      description: "Delega tareas, refactorización y planeación a agentes de IA que interactúan directamente con tu tablero.",
      bgColor: "rgba(99, 102, 241, 0.1)"
    },
    {
      icon: <Code2 size={28} style={{ color: "#10b981" }} />,
      title: "Open Source & Extensible",
      description: "Código abierto al 100%. Modifica, mejora y adapta el entorno Kanban a tus necesidades específicas.",
      bgColor: "rgba(16, 185, 129, 0.1)"
    },
    {
      icon: <Layers size={28} style={{ color: "#f59e0b" }} />,
      title: "Protocolo MCP",
      description: "Conexión bidireccional mediante Model Context Protocol para un contexto rico y comandos ejecutables.",
      bgColor: "rgba(245, 158, 11, 0.1)"
    },
    {
      icon: <Zap size={28} style={{ color: "#c026d3" }} />,
      title: "Rápido como el rayo",
      description: "Interfaz fluida con actualizaciones en tiempo real y soporte avanzado para edición Markdown.",
      bgColor: "rgba(192, 38, 211, 0.1)"
    }
  ];

  return (
    <div className="landing-container">
      {/* Background Elements */}
      <div className="landing-bg"></div>
      <div className="orb-1"></div>
      <div className="orb-2"></div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Layers className="landing-logo-icon" size={28} />
          Cronowork
        </div>
        <div className="landing-nav-links">
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
            <Github size={16} /> Proudly Open Source
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            El Kanban diseñado para <br />
            <span>Agentes de IA</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Un entorno de trabajo autónomo donde tú defines los objetivos y la IA interactúa directamente con tus proyectos usando el Model Context Protocol.
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

      {/* Features Section */}
      <section className="features-section">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Características de Próxima Generación
        </motion.h2>
        
        <motion.div 
          className="features-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="feature-card">
              <div className="feature-icon-wrapper" style={{ backgroundColor: feature.bgColor }}>
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
            src="https://avatars.githubusercontent.com/u/14493397?v=4" 
            alt="Rodrigo" 
            className="author-avatar"
            onError={(e) => {
              // Fallback if GitHub avatar fails
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
              e.target.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.target.style.padding = "20px";
            }}
          />
          <h2 className="author-name">Rodrigo</h2>
          <a href="https://github.com/rodrigo2392" target="_blank" rel="noopener noreferrer" className="author-handle">
            @rodrigo2392
          </a>
          <p className="author-bio">
            Desarrollador y creador de Cronowork. Apasionado por la inteligencia artificial, la productividad y el software de código abierto. Creé este proyecto para explorar los límites de la interacción humano-máquina a través de interfaces estructuradas.
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
