import { Injectable, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ProjectsService } from "../projects/projects.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";
import { marked } from "marked";

function formatMarkdownTitles(text: string): string {
  if (!text) return text;
  // Force newlines before and after ALL CAPS titles or titles ending with a colon
  let formatted = text.replace(/(?:^|\s+)\*\*([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]+)\*\*\s+/g, '\n\n**$1**\n');
  formatted = formatted.replace(/(?:^|\s+)\*\*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+:)\*\*\s+/g, '\n\n**$1**\n');
  return formatted.replace(/\n{3,}/g, '\n\n').trim();
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private sessions = new Map<
    string,
    { transport: SSEServerTransport; server: Server }
  >();

  constructor(
    private projectsService: ProjectsService,
    private notificationsService: NotificationsService,
    private usersService: UsersService
  ) {}

  private registerTools(server: Server, user: any) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_projects",
            description: "List all available projects in the Kanban board",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "add_task",
            description: "Add a new task to a specific project and column",
            inputSchema: {
              type: "object",
              properties: {
                projectId: {
                  type: "string",
                  description: "The ID of the project",
                },
                columnId: {
                  type: "string",
                  description: "The ID of the column (e.g. column-todo)",
                },
                title: { type: "string", description: "Task title" },
                description: {
                  type: "string",
                  description: "Task description in Markdown format. Use \\n for line breaks and ** for bold text.",
                },
                priority: { type: "string", description: "Task priority (low, medium, high, critical) (optional)" },
                tags: { type: "array", items: { type: "string" }, description: "Array of tags (optional)" },
                dueDate: { type: "string", description: "Due date in ISO format (optional)" },
                subtasks: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      id: { type: "string" }, 
                      title: { type: "string" }, 
                      completed: { type: "boolean" } 
                    } 
                  },
                  description: "Array of subtask objects (optional)" 
                },
                tokensConsumed: { type: "number", description: "Number of tokens consumed by the AI agent (optional)" },
                timeSpent: { type: "string", description: "Time spent by the AI agent, e.g. '45s', '2m' (optional)" },
                cost: { type: "number", description: "Estimated cost in USD of the AI operation (optional)" },
                model: { type: "string", description: "AI model used, e.g. 'claude-3-5-sonnet' (optional)" }
              },
              required: ["projectId", "columnId", "title"],
            },
          },
          {
            name: "update_task",
            description: "Update an existing task's title, description, or move it to a different column",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                taskId: { type: "string", description: "The ID of the task to update" },
                title: { type: "string", description: "New task title (optional)" },
                description: { type: "string", description: "New task description in Markdown format. Use \\n for line breaks (optional)" },
                priority: { type: "string", description: "New task priority (low, medium, high, critical) (optional)" },
                tags: { type: "array", items: { type: "string" }, description: "New array of tags (optional)" },
                dueDate: { type: "string", description: "New due date in ISO format (optional)" },
                subtasks: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      id: { type: "string" }, 
                      title: { type: "string" }, 
                      completed: { type: "boolean" } 
                    } 
                  },
                  description: "New array of subtask objects (optional)" 
                },
                newColumnId: { type: "string", description: "The ID of the new column to move the task to (optional)" },
                tokensConsumed: { type: "number", description: "Update number of tokens consumed by the AI agent (optional)" },
                timeSpent: { type: "string", description: "Update time spent by the AI agent (optional)" },
                cost: { type: "number", description: "Update estimated cost in USD (optional)" },
                model: { type: "string", description: "Update AI model used (optional)" }
              },
              required: ["projectId", "taskId"],
            },
          },
          {
            name: "create_project",
            description: "Create a new Kanban project",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "The name of the new project" },
                description: { type: "string", description: "The project description (optional)" }
              },
              required: ["name"],
            },
          },
          {
            name: "update_project",
            description: "Update an existing project's name or description",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project to update" },
                name: { type: "string", description: "New project name (optional)" },
                description: { type: "string", description: "New project description (optional)" }
              },
              required: ["projectId"],
            },
          },
          {
            name: "add_task_comment",
            description: "Add a comment to an existing task",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                taskId: { type: "string", description: "The ID of the task to comment on" },
                content: { type: "string", description: "The content of the comment in Markdown format" },
                agentName: { type: "string", description: "Optional name of the AI agent making the comment (defaults to 'Agente IA')" },
                mentions: { type: "array", items: { type: "string" }, description: "Optional array of user emails or exact names to tag and notify" }
              },
              required: ["projectId", "taskId", "content"],
            },
          }
        ],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const AI_AGENT_USER_ID = user.userId || "ai-mcp-agent-system-user";
      const AI_AGENT_EMAIL = user.email || "ai-mcp-agent@system.local";

      if (request.params.name === "list_projects") {
        const projects = await this.projectsService.findAll(AI_AGENT_USER_ID, AI_AGENT_EMAIL);
        return {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
        };
      }

      if (request.params.name === "add_task") {
        const { projectId, columnId, title, description, priority, tags, dueDate, subtasks, tokensConsumed, timeSpent, cost, model } = request.params
          .arguments as any;

        try {
          const project = await this.projectsService.findOne(
            projectId,
            AI_AGENT_USER_ID,
            AI_AGENT_EMAIL
          );

          const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const parsedDescription = description ? await marked.parse(formatMarkdownTitles(description), { breaks: true, gfm: true }) : "";
          const newTask: any = {
            id: taskId,
            title,
            description: parsedDescription,
            priority: priority || "medium",
            tags: tags || [],
            subtasks: subtasks || [],
            dueDate: dueDate || "",
            createdAt: new Date().toISOString(),
          };

          if (tokensConsumed !== undefined) newTask.tokensConsumed = tokensConsumed;
          if (timeSpent !== undefined) newTask.timeSpent = timeSpent;
          if (cost !== undefined) newTask.cost = cost;
          if (model !== undefined) newTask.model = model;

          // Safely inject the task into the nested structure
          project.tasks = project.tasks || {};
          project.tasks[taskId] = newTask;

          if (!project.columns[columnId]) {
            project.columns[columnId] = {
              id: columnId,
              title: columnId,
              taskIds: [],
            };
          }
          project.columns[columnId].taskIds.push(taskId);

          // Save the changes
          await this.projectsService.update(
            projectId,
            AI_AGENT_USER_ID,
            AI_AGENT_EMAIL,
            project,
          );

          return {
            content: [
              {
                type: "text",
                text: `Task successfully added. Task ID: ${taskId}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            isError: true,
            content: [{ type: "text", text: `Error adding task: ${error?.message}` }],
          };
        }
      }

      if (request.params.name === "update_task") {
        const { projectId, taskId, title, description, priority, tags, dueDate, subtasks, newColumnId, tokensConsumed, timeSpent, cost, model } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          if (!project.tasks || !project.tasks[taskId]) {
            throw new Error(`Task with ID ${taskId} not found in project`);
          }

          if (title !== undefined) project.tasks[taskId].title = title;
          if (description !== undefined) {
             project.tasks[taskId].description = description ? await marked.parse(formatMarkdownTitles(description), { breaks: true, gfm: true }) : "";
          }
          if (priority !== undefined) project.tasks[taskId].priority = priority;
          if (tags !== undefined) project.tasks[taskId].tags = tags;
          if (dueDate !== undefined) project.tasks[taskId].dueDate = dueDate;
          if (subtasks !== undefined) project.tasks[taskId].subtasks = subtasks;
          
          if (tokensConsumed !== undefined) project.tasks[taskId].tokensConsumed = tokensConsumed;
          if (timeSpent !== undefined) project.tasks[taskId].timeSpent = timeSpent;
          if (cost !== undefined) project.tasks[taskId].cost = cost;
          if (model !== undefined) project.tasks[taskId].model = model;

          if (newColumnId) {
            // Find current column
            let currentColumnId = null;
            for (const [colId, col] of Object.entries(project.columns || {})) {
              if ((col as any).taskIds.includes(taskId)) {
                currentColumnId = colId;
                break;
              }
            }

            if (currentColumnId && currentColumnId !== newColumnId) {
              // Remove from old column
              project.columns[currentColumnId].taskIds = project.columns[currentColumnId].taskIds.filter(
                (id: string) => id !== taskId
              );
              
              // Add to new column
              if (!project.columns[newColumnId]) {
                 project.columns[newColumnId] = { id: newColumnId, title: newColumnId, taskIds: [] };
              }
              project.columns[newColumnId].taskIds.push(taskId);
            }
          }

          // Force mongoose to recognize changes to mixed types
          project.markModified('tasks');
          project.markModified('columns');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Task ${taskId} successfully updated.` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error updating task: ${error?.message}` }] };
        }
      }

      if (request.params.name === "add_task_comment") {
        const { projectId, taskId, content, agentName, mentions } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          if (!project.tasks || !project.tasks[taskId]) {
            throw new Error(`Task with ID ${taskId} not found in project`);
          }

          const parsedContent = content ? await marked.parse(content, { breaks: true, gfm: true }) : "";
          const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          const newComment = {
            id: commentId,
            content: parsedContent,
            userId: AI_AGENT_USER_ID,
            userName: agentName || "Agente IA",
            createdAt: new Date().toISOString(),
            parentId: null
          };

          if (!project.tasks[taskId].comments) {
            project.tasks[taskId].comments = [];
          }
          project.tasks[taskId].comments.push(newComment);

          project.markModified('tasks');
          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);

          // Handle mentions
          if (mentions && Array.isArray(mentions) && mentions.length > 0) {
            for (const identifier of mentions) {
              const targetUser = await this.usersService.findByEmailOrName(identifier);
              if (targetUser) {
                const targetUserId = targetUser._id.toString();
                // Ensure the user is actually part of the project
                if (project.userId === targetUserId || (project.sharedWith && project.sharedWith.includes(targetUserId))) {
                  await this.notificationsService.create({
                    userId: targetUserId,
                    title: 'Mención en tarea',
                    message: `El ${agentName || "Agente IA"} te ha mencionado en la tarea "${project.tasks[taskId].title || taskId}"`,
                    type: 'SYSTEM',
                    taskId: taskId,
                    projectId: projectId
                  });
                }
              }
            }
          }

          return { content: [{ type: "text", text: `Comment successfully added to task ${taskId}. Comment ID: ${commentId}` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error adding comment: ${error?.message}` }] };
        }
      }

      if (request.params.name === "create_project") {
        const { name, description } = request.params.arguments as any;
        try {
          const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const projectData = {
            id: projectId,
            name,
            description: description || "",
            prefix: name.substring(0, 3).toUpperCase(),
            icon: "Briefcase",
            tasks: {},
            columnOrder: ["column-todo", "column-in-progress", "column-done"],
            columns: {
              "column-todo": { id: "column-todo", title: "To Do", taskIds: [] },
              "column-in-progress": { id: "column-in-progress", title: "In Progress", taskIds: [] },
              "column-done": { id: "column-done", title: "Done", taskIds: [] }
            }
          };

          const newProject = await this.projectsService.create(AI_AGENT_USER_ID, projectData);
          return {
            content: [{ type: "text", text: `Project successfully created. Project ID: ${newProject.id}` }],
          };
        } catch (error: any) {
          return {
            isError: true,
            content: [{ type: "text", text: `Error creating project: ${error?.message}` }],
          };
        }
      }

      if (request.params.name === "update_project") {
        const { projectId, name, description } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          if (name !== undefined) project.name = name;
          if (description !== undefined) project.description = description;

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return {
            content: [{ type: "text", text: `Project ${projectId} successfully updated.` }],
          };
        } catch (error: any) {
          return {
            isError: true,
            content: [{ type: "text", text: `Error updating project: ${error?.message}` }],
          };
        }
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  async handleSse(req: Request, res: Response) {
    this.logger.log("New MCP SSE connection establishing...");

    const appUrl = process.env.APP_URL ?? 'https://cronowork.app';
    const baseUrl = appUrl.replace(/\/+$/, '') + '/api/mcp/messages';

    const token = req.query.token as string;
    const endpoint = token ? `${baseUrl}?token=${token}` : baseUrl;

    // The MCP SDK sends a relative URL in the endpoint event even when given an absolute URL.
    // Intercept res.write to force the correct absolute URL before the SDK writes it.
    const originalWrite = res.write.bind(res);
    let endpointEventPatched = false;
    (res as any).write = function (chunk: any, ...args: any[]) {
      if (!endpointEventPatched && typeof chunk === 'string' && chunk.includes('event: endpoint')) {
        endpointEventPatched = true;
        const sessionMatch = chunk.match(/sessionId=([\w-]+)/);
        const sessionId = sessionMatch ? sessionMatch[1] : '';
        chunk = `event: endpoint\ndata: ${endpoint}&sessionId=${sessionId}\n\n`;
      }
      return originalWrite(chunk, ...args);
    };

    const transport = new SSEServerTransport(endpoint, res);

    const server = new Server(
      { name: "vibe-kanban-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    const user = (req as any).user || {};
    this.registerTools(server, user);
    await server.connect(transport);

    const sessionId = transport.sessionId;
    this.sessions.set(sessionId, { transport, server });
    this.logger.log(`MCP SSE connection established for session: ${sessionId}`);

    // Clean up when the client disconnects
    res.on("close", () => {
      this.logger.log(
        `SSE connection closed. Cleaning up session: ${sessionId}`,
      );
      server.close().catch(() => {});
      this.sessions.delete(sessionId);
    });
  }

  async handleMessages(req: Request, res: Response) {
    const sessionId = req.query.sessionId as string;
    this.logger.log(`POST /mcp/messages — sessionId: ${sessionId}, activeSessions: ${this.sessions.size}`);

    if (!sessionId) {
      this.logger.error("Missing sessionId in message request");
      res.status(400).send("Missing sessionId");
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.error(`Session not found: ${sessionId}. Active sessions: ${[...this.sessions.keys()].join(', ')}`);
      res.status(404).send("Session not found");
      return;
    }

    this.logger.log(`Handling message for session: ${sessionId}`);
    await session.transport.handlePostMessage(req, res, req.body);
  }
}
