# Graph Report - cronowork  (2026-06-25)

## Corpus Check
- 82 files · ~82,643 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 396 nodes · 813 edges · 21 communities (13 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a95ea9a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 43 edges
2. `useBoard()` - 41 edges
3. `useAuth()` - 28 edges
4. `ProjectsService` - 23 edges
5. `UsersService` - 20 edges
6. `Project` - 19 edges
7. `compilerOptions` - 18 edges
8. `NotificationsService` - 15 edges
9. `ProjectsController` - 14 edges
10. `useConfirm()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Header()` --calls--> `useTheme()`  [EXTRACTED]
  apps/frontend/src/components/Header.jsx → apps/frontend/src/context/ThemeContext.jsx
- `LandingPage()` --calls--> `useTranslation()`  [EXTRACTED]
  apps/frontend/src/components/LandingPage.jsx → apps/frontend/src/context/LanguageContext.jsx
- `bootstrap()` --calls--> `getCorsOrigins()`  [EXTRACTED]
  apps/backend/src/main.ts → apps/backend/src/config/cors.ts
- `BoardWrapper()` --calls--> `useAuth()`  [EXTRACTED]
  apps/frontend/src/App.jsx → apps/frontend/src/context/AuthContext.jsx
- `BoardWrapper()` --calls--> `useBoard()`  [EXTRACTED]
  apps/frontend/src/App.jsx → apps/frontend/src/context/BoardContext.jsx

## Import Cycles
- None detected.

## Communities (21 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (46): ActivityModal(), AiTaskModal(), ArchiveColumn(), ArchiveModal(), AuthPage(), BacklogSprintsView(), Board(), Column() (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (40): dependencies, bcryptjs, class-transformer, class-validator, helmet, marked, @modelcontextprotocol/sdk, mongoose (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (22): JwtAuthGuard, DEFAULT_DEV_ORIGINS, getCorsOrigins(), CreateNotificationDto, EventsGateway, EventsModule, McpModule, NotificationsController (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.24
Nodes (4): AiController, AiModule, AiService, GenerateTasksDto

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): dependencies, dompurify, framer-motion, @hello-pangea/dnd, lucide-react, quilljs-markdown, react, react-dom (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (20): dependencies, puppeteer-core, devDependencies, concurrently, patch-package, name, private, scripts (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (5): InviteDto, SetRoleDto, ShareLinkDto, MoveDto, ProjectsController

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (15): ✨ Características Principales, 🤝 Contributing / Contribuyendo, 🚀 Cronowork, 🇪🇸 Documentación en Español, 🚀 Empezando a Usar Cronowork, 🇬🇧 English Documentation, 🚀 Getting Started, Instalación (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (6): AuthController, AuthModule, AuthService, JwtStrategy, LoginDto, RegisterDto

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (12): Backend (API e IA), ✨ Características Principales, 🤝 Contribuir, 🚀 Cronowork, 🧠 Cómo usar el Generador con IA, Frontend (Interfaz de Usuario), 🚀 Inicio Rápido, Instalación (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.43
Nodes (5): LandingPage(), useTypewriter(), ThemeContext, ThemeProvider(), useTheme()

### Community 14 - "Community 14"
Cohesion: 0.40
Nodes (4): fs, path, sseMjsPath, ssePath

## Knowledge Gaps
- **131 isolated node(s):** `fs`, `path`, `ssePath`, `sseMjsPath`, `name` (+126 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UsersService` connect `Community 2` to `Community 10`, `Community 3`, `Community 13`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `ProjectsController` connect `Community 7` to `Community 2`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `ProjectsService` connect `Community 3` to `Community 2`, `Community 4`, `Community 13`, `Community 7`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `ssePath` to the rest of the system?**
  _131 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10023310023310024 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06054054054054054 - nodes in this community are weakly interconnected._