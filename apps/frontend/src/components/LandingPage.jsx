import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Code2, Bot, Layers, Zap, Sun, Moon, Globe, Menu, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import '../styles/LandingPage.css';

const useTypewriter = (words, typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) => {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout;
    
    if (isDeleting) {
      timeout = setTimeout(() => {
        setText(currentWord.substring(0, text.length - 1));
      }, deletingSpeed);
    } else {
      timeout = setTimeout(() => {
        setText(currentWord.substring(0, text.length + 1));
      }, typingSpeed);
    }

    if (!isDeleting && text === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, words, wordIndex, typingSpeed, deletingSpeed, pauseTime]);

  return text;
};

export default function LandingPage({ onNavigateToAuth }) {
  const { t, locale, toggleLanguage } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('vibe_theme') || 'dark');
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeUseCase, setActiveUseCase] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const typedText = useTypewriter([
    t("landing.title_span") || "Agentes de IA",
    "Claude Code",
    "Desarrolladores",
    "Equipos Autónomos"
  ]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vibe_theme', theme);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
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
      title: t("landing.feat1_title") || "IA Autónoma",
      description: t("landing.feat1_desc") || "Delega tareas, refactorización y planeación a agentes de IA que interactúan con tu tablero.",
      isLarge: true
    },
    {
      icon: <Layers size={24} style={{ color: "var(--accent-color)" }} />,
      title: t("landing.feat2_title") || "Model Context Protocol",
      description: t("landing.feat2_desc") || "Conexión bidireccional para un contexto rico y ejecución de comandos directos.",
      isLarge: false
    },
    {
      icon: <Zap size={24} style={{ color: "var(--priority-medium)" }} />,
      title: t("landing.feat3_title") || "Rápido y Fluido",
      description: t("landing.feat3_desc") || "Actualizaciones en tiempo real y soporte avanzado para edición Markdown sin latencia.",
      isLarge: false
    },
    {
      icon: <Code2 size={24} style={{ color: "var(--completed-color)" }} />,
      title: t("landing.feat4_title") || "100% Open Source",
      description: t("landing.feat4_desc") || "Modifica, mejora y adapta el entorno Kanban a las necesidades de tu equipo sin restricciones.",
      isLarge: true
    }
  ];

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Layers className="landing-logo-icon" size={28} />
          Cronowork
        </div>
        <div className="landing-nav-links desktop-only">
          <button onClick={toggleLanguage} className="theme-toggle-btn" aria-label="Toggle Language" title="Language">
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{locale.toUpperCase()}</span>
          </button>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="landing-nav-link">
            GitHub
          </a>
          <button onClick={onNavigateToAuth} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>
            {t("landing.login") || "Iniciar Sesión"}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Mobile Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <button onClick={() => { toggleLanguage(); setIsMobileMenuOpen(false); }} className="mobile-menu-item">
              <Globe size={18} /> {locale === 'es' ? 'English' : 'Español'}
            </button>
            <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} className="mobile-menu-item">
              {theme === 'dark' ? <><Sun size={18} /> Modo Claro</> : <><Moon size={18} /> Modo Oscuro</>}
            </button>
            <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="mobile-menu-item">
              <Github size={18} /> GitHub
            </a>
            <div className="mobile-menu-divider"></div>
            <button onClick={onNavigateToAuth} className="btn-primary w-full" style={{ padding: "10px", marginTop: "10px" }}>
              {t("landing.login") || "Iniciar Sesión"}
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section" onMouseMove={handleMouseMove}>
        <div className="hero-glow-static"></div>
        <div className="hero-bg-static"></div>
        <div className="hero-bg-interactive"></div>
        
        <div className="hero-content">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div variants={itemVariants} className="open-source-badge">
              <Github size={16} /> {t("landing.badge") || "Orgullosamente Open Source"}
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="hero-title">
            {t("landing.title_1") || "El Kanban diseñado para "} <br />
            <span>{typedText}</span><span className="typing-cursor">|</span>
          </motion.h1>
            
            <motion.p variants={itemVariants} className="hero-subtitle">
              {t("landing.subtitle") || "Un entorno de trabajo autónomo donde tú defines los objetivos y la IA interactúa directamente con tus proyectos mediante comandos estructurados."}
            </motion.p>
            
            <motion.div variants={itemVariants} className="hero-actions">
              <button onClick={onNavigateToAuth} className="btn-primary">
                {t("landing.btn_start") || "Comenzar gratis"} <ArrowRight size={18} />
              </button>
              <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <Github size={18} /> {t("landing.btn_repo") || "Ver repositorio"}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* App Showcase 3D Overlap Section */}
      <section className="showcase-section">
        <motion.div 
          className="showcase-container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {[
            { src: "/cap1.png", alt: "Cronowork App Preview 1" },
            { src: "/cap2.png", alt: "Cronowork App Preview 2" },
            { src: "/cap3.png", alt: "Cronowork App Preview 3" },
          ].map((img, index) => {
            // Determine relative position
            let positionClass = "img-1"; // default front
            if (index === (activeShowcase + 1) % 3) positionClass = "img-3"; // back right
            if (index === (activeShowcase + 2) % 3) positionClass = "img-2"; // back left
            
            return (
              <div key={index} className={`showcase-image-wrapper ${positionClass}`}>
                <img src={img.src} alt={img.alt} />
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works-section">
        <motion.div 
          className="hiw-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="section-title">
            {t("landing.hiw_title")}
          </motion.h2>
          
          <div className="hiw-steps">
            {[1, 2, 3].map((step) => (
              <motion.div key={step} variants={itemVariants} className="hiw-step">
                <div className="hiw-number">{step}</div>
                <h3 className="hiw-step-title">{t(`landing.hiw_step${step}_title`)}</h3>
                <p className="hiw-step-desc">{t(`landing.hiw_step${step}_desc`)}</p>
                {step !== 3 && <div className="hiw-connector"></div>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <motion.div 
          className="uc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="section-title">
            {t("landing.uc_title")}
          </motion.h2>

          <div className="uc-content">
            <div className="uc-tabs">
              {[1, 2, 3].map((tab) => (
                <button 
                  key={tab}
                  className={`uc-tab ${activeUseCase === tab ? 'active' : ''}`}
                  onClick={() => setActiveUseCase(tab)}
                >
                  <span className="uc-tab-num">0{tab}</span>
                  {t(`landing.uc_tab${tab}`)}
                </button>
              ))}
            </div>

            <div className="uc-display">
              <motion.div 
                key={activeUseCase}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="uc-card"
              >
                <h3>{t(`landing.uc_tab${activeUseCase}_title`)}</h3>
                <p>{t(`landing.uc_tab${activeUseCase}_desc`)}</p>
                <div className="uc-mockup">
                  <div className="uc-mockup-header">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  <div className="uc-mockup-body">
                    {/* Abstract Representation of the Workflow */}
                    <div className="uc-abstract-line" style={{ width: '60%' }}></div>
                    <div className="uc-abstract-line" style={{ width: '80%' }}></div>
                    <div className="uc-abstract-line accent" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
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
          {t("landing.features_title") || "Un nuevo paradigma de productividad"}
        </motion.h2>
        
        <motion.div 
          className="bento-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants} 
              className={`bento-card ${feature.isLarge ? 'bento-large' : ''}`}
              onMouseMove={handleMouseMove}
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <motion.div 
          className="faq-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="section-title">
            {t("landing.faq_title")}
          </motion.h2>
          
          <div className="faq-list">
            {[1, 2, 3].map((num) => {
              const isOpen = activeFaq === num;
              return (
                <motion.div key={num} variants={itemVariants} className={`faq-item ${isOpen ? 'active' : ''}`}>
                  <button className="faq-question" onClick={() => setActiveFaq(isOpen ? null : num)}>
                    {t(`landing.faq_q${num}`)}
                    <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  <div className="faq-answer-wrapper" style={{ height: isOpen ? 'auto' : 0, overflow: 'hidden' }}>
                    <div className="faq-answer">
                      {t(`landing.faq_a${num}`)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
            src="https://rodrigomendez.dev/_next/image?url=%2Fimages%2Fperfil.png&w=1200&q=75" 
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
            {t("landing.author_bio") || "Desarrollador y creador de Cronowork. Apasionado por la inteligencia artificial, la productividad y el software libre. Construí este proyecto para explorar cómo los agentes autónomos pueden colaborar en interfaces estructuradas."}
          </p>
          <a href="https://github.com/rodrigo2392/cronowork" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <Github size={18} /> {t("landing.author_btn") || "Seguir el proyecto"}
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>{(t("landing.footer") || "© {year} Cronowork. Lanzado bajo licencia Open Source.").replace('{year}', new Date().getFullYear())}</p>
      </footer>
    </div>
  );
}
