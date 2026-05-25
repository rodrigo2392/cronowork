<div align="center">
  
# 🚀 Cronowork
**El Tablero Kanban Impulsado por IA de Nueva Generación**

[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![OpenAI](https://img.shields.io/badge/IA-OpenAI-412991?style=for-the-badge&logo=openai)](https://openai.com/)
[![MCP](https://img.shields.io/badge/Protocolo-MCP_Ready-000000?style=for-the-badge)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/Licencia-MIT-green.svg?style=for-the-badge)](LICENSE)

*Lee esto en [Inglés (English)](README.md).*

</div>

---

## 💡 ¿Qué es Cronowork?

**Cronowork** es una herramienta de gestión de proyectos de código abierto con diseño premium, creada para equipos de desarrollo modernos y creadores independientes. Combina a la perfección un tablero Kanban altamente responsivo con **Inteligencia Artificial** de vanguardia y soporte nativo para **Model Context Protocol (MCP)**.

Despídete de la tediosa planificación manual de tareas. Describe tu proyecto a Cronowork y deja que la Inteligencia Artificial lo desglose en tickets accionables y categorizados al instante.

---

## ✨ Características Principales

- 🤖 **Generación Automática de Tareas**: Escribe una instrucción (ej: *"Construir un sistema de login para un e-commerce"*) y la integración nativa con OpenAI fabricará e inyectará las tareas estructuradas directamente en tu tablero.
- 🔌 **Servidor MCP Integrado**: Incluye un servidor Model Context Protocol. Expón de manera segura tus tableros y tareas a otros agentes de IA externos.
- 🎨 **Diseño Premium**: Animaciones fluidas cortesía de Framer Motion, diseño tipo *glassmorphism* y una estética deslumbrante que respeta el Modo Oscuro/Claro nativo de tu sistema.
- 💬 **Comentarios con Formato Enriquecido**: Un editor WYSIWYG completo (ReactQuill) permite a tu equipo dejar comentarios con formato, bloques de código e hilos de respuesta.
- 🌍 **Multilingüe (i18n)**: Interfaz completamente localizada en Español e Inglés. Alterna el idioma sin recargar la página.
- 🏗️ **Arquitectura Monorepo**: Arquitectura limpia y escalable que separa el Frontend en React y el Backend en NestJS dentro del mismo repositorio.

---

## 🛠️ Stack Tecnológico

### Frontend (Interfaz de Usuario)
* **Framework**: React 18
* **Herramienta de Construcción**: Vite
* **Estilos**: Vanilla CSS (Uso de variables CSS para temas dinámicos)
* **Animaciones**: Framer Motion
* **Iconos**: Lucide React
* **Editor Enriquecido**: ReactQuill

### Backend (API e IA)
* **Framework**: NestJS
* **Integración IA**: SDK oficial de OpenAI (`gpt-4o-mini`)
* **Protocolo**: MCP SDK (Model Context Protocol)
* **Seguridad**: Autenticación mediante JWT

---

## 🚀 Inicio Rápido

### Requisitos Previos
Asegúrate de tener instalado en tu equipo:
- Node.js (v18 o superior)
- npm (v9 o superior)

### Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/your-username/cronowork.git
   cd cronowork
   ```

2. **Instala las dependencias del Monorepo:**
   ```bash
   npm install
   ```

3. **Configura las Variables de Entorno:**
   Navega al directorio del backend y configura la seguridad:
   ```bash
   cd apps/backend
   # Crea tu archivo .env
   echo "OPENAI_API_KEY=sk-tu-clave-api-secreta" > .env
   cd ../..
   ```

4. **Ejecuta la Aplicación:**
   Cronowork utiliza los *workspaces* de npm. Puedes iniciar tanto el frontend como el backend simultáneamente desde la raíz.
   
   Inicia el Servidor (Backend):
   ```bash
   npm run dev:backend
   ```
   
   Inicia la Web (Frontend) en una nueva terminal:
   ```bash
   npm run dev:frontend
   ```

5. **Abre tu navegador:**
   Navega a `http://localhost:5173` para comenzar a utilizar Cronowork.

---

## 🧠 Cómo usar el Generador con IA

1. Abre un Tablero de Proyecto.
2. Haz clic en el botón brillante de **"Generar Tareas"** en la barra superior.
3. En la ventana emergente, escribe tu requerimiento. *Ejemplo: "Crea las tareas necesarias para implementar una pasarela de pago con Stripe en una aplicación React."*
4. Haz clic en Generar. La IA analizará tu solicitud y llenará la primera columna de tu tablero con tareas accionables.

---

## 🤝 Contribuir

¡Cronowork es un proyecto de código abierto y agradecemos cualquier contribución de la comunidad!

1. Haz un Fork del proyecto
2. Crea tu rama para la nueva funcionalidad (`git checkout -b feature/NuevaFuncionalidad`)
3. Confirma tus cambios (`git commit -m 'Añade NuevaFuncionalidad'`)
4. Haz push a tu rama (`git push origin feature/NuevaFuncionalidad`)
5. Abre un Pull Request

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
