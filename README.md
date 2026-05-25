<div align="center">
  
# 🚀 Cronowork
**The Next-Generation AI-Powered Kanban Board** | **El Tablero Kanban del Futuro con IA**

[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![OpenAI](https://img.shields.io/badge/AI_Powered-OpenAI-412991?style=for-the-badge&logo=openai)](https://openai.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

# 🇬🇧 English Documentation

## 💡 What is Cronowork?

**Cronowork** is a premium, open-source project management tool designed for modern development teams and solo creators. It seamlessly blends a highly responsive Kanban board with state-of-the-art **Artificial Intelligence** and **Model Context Protocol (MCP)** integration.

Say goodbye to manual task planning. Describe your project to Cronowork, and let the AI break it down into actionable, categorized Kanban tickets instantly.

## ✨ Key Features

- 🤖 **AI Task Generation**: Write a single prompt (e.g., *"Build an e-commerce login system"*) and watch as the OpenAI integration automatically generates and injects structured tasks directly into your board.
- ⏱️ **Smart Time Tracking**: Automatically starts a timer when you drag a task to the "In Progress" column, and stops it when moved to "Done". Manual time-tracking is also fully supported.
- 🗄️ **Advanced Archiving System**: Keep your board clean. Configure auto-archiving for completed tasks (e.g., 3, 7, 15, or 30 days) or manually drag tasks into the fixed Archive column. View your history and restore tasks anytime.
- 📊 **User Activity Logs & Mentions**: A dedicated Activity Modal to see all recent interactions, comments, and task assignments for any user. Supports `@mentions` directly inside task descriptions and comments.
- 🔌 **MCP Server Ready**: Built-in Model Context Protocol server. Expose your Kanban boards and tasks to external AI agents securely.
- 🎨 **Premium UI/UX**: Fluid animations (Framer Motion), glassmorphism design, and a stunning aesthetic that respects your system's Dark/Light mode natively.
- 💬 **Rich Text Threaded Comments**: A fully integrated WYSIWYG editor (ReactQuill) allows your team to leave formatted comments, code snippets, and threaded replies on any task.
- 🌍 **Internationalization (i18n)**: Fully localized in English and Spanish. Change the UI language on the fly.
- 🏗️ **Modern Monorepo**: Clean and scalable architecture separating the React frontend and NestJS backend within a single repository, backed by **MongoDB**.

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (Local or Atlas URL)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/cronowork.git
   cd cronowork
   ```

2. **Install dependencies for the Monorepo:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Navigate to the backend directory and set up your environment:
   ```bash
   cd apps/backend
   # Create your .env file
   echo "OPENAI_API_KEY=sk-your-secret-api-key" > .env
   echo "MONGO_URI=mongodb://localhost:27017/cronowork" >> .env
   echo "JWT_SECRET=super_secret_key" >> .env
   echo "PORT=3500" >> .env
   cd ../..
   ```

4. **Run the Application:**
   Start the Backend:
   ```bash
   npm run dev:backend
   ```
   Start the Frontend (in a new terminal):
   ```bash
   npm run dev:frontend
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` to start using Cronowork!

---
---

# 🇪🇸 Documentación en Español

## 💡 ¿Qué es Cronowork?

**Cronowork** es una herramienta de gestión de proyectos premium de código abierto diseñada para equipos de desarrollo modernos y creadores individuales. Combina a la perfección un tablero Kanban altamente responsivo con **Inteligencia Artificial** de última generación e integración con **Model Context Protocol (MCP)**.

Dile adiós a la planificación manual de tareas. Describe tu proyecto a Cronowork y deja que la IA lo desglose en tickets Kanban estructurados y categorizados al instante.

## ✨ Características Principales

- 🤖 **Generación de Tareas por IA**: Escribe un simple prompt (ej., *"Construir un sistema de login para e-commerce"*) y observa cómo la integración con OpenAI genera e inyecta automáticamente tareas estructuradas directamente en tu tablero.
- ⏱️ **Registro de Tiempo Inteligente**: El temporizador se inicia automáticamente cuando arrastras una tarea a la columna "En Progreso" y se detiene cuando pasa a la columna final. El cronometraje manual también está totalmente soportado.
- 🗄️ **Sistema de Archivados Avanzado**: Mantén tu tablero limpio. Configura el auto-archivado para tareas terminadas (ej., a los 3, 7, 15 o 30 días) o arrástralas manualmente a la columna fija de Archivo. Revisa el historial y restaura tareas en cualquier momento.
- 📊 **Registro de Actividad y Menciones**: Un modal de actividad dedicado para ver todas las interacciones recientes, comentarios y asignaciones de cualquier usuario. Soporta menciones con `@` directamente dentro de descripciones y comentarios.
- 🔌 **Preparado para Servidor MCP**: Servidor Model Context Protocol integrado. Expón tus tableros y tareas a agentes de IA externos de forma segura.
- 🎨 **UI/UX Premium**: Animaciones fluidas (Framer Motion), diseño glassmorphism y una estética impresionante que respeta el modo Oscuro/Claro nativo de tu sistema.
- 💬 **Comentarios de Texto Enriquecido**: Un editor WYSIWYG totalmente integrado (ReactQuill) permite a tu equipo dejar comentarios formateados, fragmentos de código y respuestas anidadas en cualquier tarea.
- 🌍 **Internacionalización (i18n)**: Totalmente localizado en Inglés y Español. Cambia el idioma de la interfaz al instante.
- 🏗️ **Monorepo Moderno**: Arquitectura limpia y escalable que separa el frontend en React y el backend en NestJS dentro de un único repositorio, respaldado por **MongoDB**.

## 🚀 Empezando a Usar Cronowork

### Requisitos Previos
Asegúrate de tener lo siguiente instalado en tu máquina:
- Node.js (v18 o superior)
- npm (v9 o superior)
- MongoDB (Instalación local o URL de Atlas)

### Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/cronowork.git
   cd cronowork
   ```

2. **Instala las dependencias del Monorepo:**
   ```bash
   npm install
   ```

3. **Configura las Variables de Entorno:**
   Ve a la carpeta del backend y configura tu entorno:
   ```bash
   cd apps/backend
   # Crea tu archivo .env
   echo "OPENAI_API_KEY=sk-tu-clave-secreta" > .env
   echo "MONGO_URI=mongodb://localhost:27017/cronowork" >> .env
   echo "JWT_SECRET=super_clave_secreta" >> .env
   echo "PORT=3500" >> .env
   cd ../..
   ```

4. **Ejecuta la Aplicación:**
   Inicia el Backend:
   ```bash
   npm run dev:backend
   ```
   Inicia el Frontend (en una nueva terminal):
   ```bash
   npm run dev:frontend
   ```

5. **Abre tu navegador:**
   Navega a `http://localhost:5173` para empezar a usar Cronowork.

---

## 🤝 Contributing / Contribuyendo

Cronowork is an Open Source project and we welcome contributions!
¡Cronowork es un proyecto de Código Abierto y agradecemos las contribuciones!

1. Fork the Project / Crea un Fork del proyecto
2. Create your Feature Branch / Crea una rama de funcionalidad (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes / Haz commit a tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch / Sube los cambios a la rama (`git push origin feature/AmazingFeature`)
5. Open a Pull Request / Abre un Pull Request

---

## 📜 License / Licencia

Distributed under the MIT License. See `LICENSE` for more information.  
Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
