import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
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
    { transport: SSEServerTransport; server: Server; userId?: string }
  >();

  constructor(
    private projectsService: ProjectsService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Authenticate an MCP request. Prefers the Authorization: Bearer header;
  // falls back to a ?token= query param for SSE clients that can't send headers.
  private authenticate(req: Request): { userId: string; email: string } | null {
    let token: string | undefined;
    const authHeader = (req.headers['authorization'] || (req.headers as any)['Authorization']) as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.query.token) {
      token = req.query.token as string;
    }
    if (!token) return null;
    try {
      const payload: any = this.jwtService.verify(token);
      return { userId: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  private registerTools(server: Server, user: any) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_projects",
            description: "List all available projects (Shallow fetch: returns only id, name, description, and task count). Use get_project_board to see the tasks.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "get_project_board",
            description: "Get the Kanban board state of a specific project (excluding activity log and truncating long task descriptions).",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project to retrieve" }
              },
              required: ["projectId"],
            },
          },
          {
            name: "get_task_details",
            description: "Get the complete details of a specific task (including full description and all comments).",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                taskId: { type: "string", description: "The ID of the task" }
              },
              required: ["projectId", "taskId"],
            },
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
                sprintId: { type: "string", description: "The ID of the sprint to associate the task with (optional)" },
                storyPoints: { type: "number", description: "The story point estimation for the task (optional)" },
                dodCompletedItems: { type: "array", items: { type: "string" }, description: "Array of completed Definition of Done items titles (optional)" },
                assignee: { type: "string", description: "The email address of the user assigned to this task (optional)" },
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
                sprintId: { type: "string", description: "The ID of the sprint, or 'backlog'/empty string to send back to backlog (optional)" },
                storyPoints: { type: "number", description: "The story point estimation for the task (optional)" },
                dodCompletedItems: { type: "array", items: { type: "string" }, description: "New array of completed Definition of Done items titles (optional)" },
                assignee: { type: "string", description: "The email address of the user assigned to this task, or empty/null to unassign (optional)" },
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
          },
          {
            name: "list_sprints",
            description: "List all sprints for a specific project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" }
              },
              required: ["projectId"]
            }
          },
          {
            name: "create_sprint",
            description: "Create a new sprint in a project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                name: { type: "string", description: "The name of the new sprint" },
                startDate: { type: "string", description: "The start date in YYYY-MM-DD format (optional)" },
                endDate: { type: "string", description: "The end date in YYYY-MM-DD format (optional)" },
                goal: { type: "string", description: "The sprint goal (optional)" }
              },
              required: ["projectId", "name"]
            }
          },
          {
            name: "update_sprint",
            description: "Update details of an existing sprint (name, dates, goal, status, retro notes)",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                sprintId: { type: "string", description: "The ID of the sprint to update" },
                name: { type: "string", description: "New name of the sprint (optional)" },
                startDate: { type: "string", description: "New start date in YYYY-MM-DD format (optional)" },
                endDate: { type: "string", description: "New end date in YYYY-MM-DD format (optional)" },
                goal: { type: "string", description: "New sprint goal (optional)" },
                status: { type: "string", description: "Sprint status: 'planned', 'active', 'completed' (optional)" },
                retro: {
                  type: "object",
                  properties: {
                    wentWell: { type: "array", items: { type: "string" }, description: "Things that went well (optional)" },
                    toImprove: { type: "array", items: { type: "string" }, description: "Things to improve (optional)" },
                    actions: { type: "array", items: { type: "string" }, description: "Retro action items (optional)" }
                  },
                  description: "Sprint retrospective data (optional)"
                }
              },
              required: ["projectId", "sprintId"]
            }
          },
          {
            name: "complete_sprint",
            description: "Complete a sprint. Move uncompleted tasks to the backlog or to another sprint, record stats, and log retro notes.",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                sprintId: { type: "string", description: "The ID of the sprint to complete" },
                fallbackSprintId: { type: "string", description: "The ID of the sprint to roll incomplete tasks forward to, or 'backlog' (optional, defaults to 'backlog')" },
                retro: {
                  type: "object",
                  properties: {
                    wentWell: { type: "array", items: { type: "string" }, description: "Things that went well (optional)" },
                    toImprove: { type: "array", items: { type: "string" }, description: "Things to improve (optional)" },
                    actions: { type: "array", items: { type: "string" }, description: "Retro action items (optional)" }
                  },
                  description: "Sprint retrospective data (optional)"
                }
              },
              required: ["projectId", "sprintId"]
            }
          },
          {
            name: "update_project_dod",
            description: "Update the project's Definition of Done (DoD) list",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                definitionOfDone: { type: "array", items: { type: "string" }, description: "Array of Definition of Done criterion strings" }
              },
              required: ["projectId", "definitionOfDone"]
            }
          },
          {
            name: "delete_task",
            description: "Delete an existing task from a specific project and column",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                taskId: { type: "string", description: "The ID of the task to delete" },
                columnId: { type: "string", description: "The ID of the column where the task resides (optional)" }
              },
              required: ["projectId", "taskId"]
            }
          },
          {
            name: "delete_sprint",
            description: "Delete a sprint from a project and return its tasks to the backlog",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "The ID of the project" },
                sprintId: { type: "string", description: "The ID of the sprint to delete" }
              },
              required: ["projectId", "sprintId"]
            }
          }
        ],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const AI_AGENT_USER_ID = user.userId || "ai-mcp-agent-system-user";
      const AI_AGENT_EMAIL = user.email || "ai-mcp-agent@system.local";

      if (request.params.name === "list_projects") {
        const projects = await this.projectsService.findAll(AI_AGENT_USER_ID, AI_AGENT_EMAIL);
        const shallowProjects = projects.map(p => {
          const raw = typeof p.toObject === 'function' ? p.toObject() : p;
          return {
            id: raw.id,
            name: raw.name,
            description: raw.description,
            taskCount: raw.tasks ? Object.keys(raw.tasks).length : 0
          };
        });
        // Minified JSON (no spaces) to save tokens
        return { content: [{ type: "text", text: JSON.stringify(shallowProjects) }] };
      }

      if (request.params.name === "get_project_board") {
        const { projectId } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          const raw = typeof project.toObject === 'function' ? project.toObject() : project;
          
          // Omit activityLog to save tokens
          delete raw.activityLog;
          
          // Truncate descriptions and remove comments for board view
          if (raw.tasks) {
            for (const taskId in raw.tasks) {
              const task = raw.tasks[taskId];
              if (task.description && task.description.length > 100) {
                task.description = task.description.substring(0, 100) + "... [Truncated, use get_task_details]";
              }
              if (task.comments) {
                task.commentsCount = task.comments.length;
                delete task.comments;
              }
            }
          }
          
          return { content: [{ type: "text", text: JSON.stringify(raw) }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error: ${error?.message}` }] };
        }
      }

      if (request.params.name === "get_task_details") {
        const { projectId, taskId } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          if (!project.tasks || !project.tasks[taskId]) {
            throw new Error(`Task ${taskId} not found`);
          }
          
          const taskDetails = typeof project.tasks[taskId].toObject === 'function' 
            ? project.tasks[taskId].toObject() 
            : project.tasks[taskId];
            
          return { content: [{ type: "text", text: JSON.stringify(taskDetails) }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error: ${error?.message}` }] };
        }
      }

      if (request.params.name === "add_task") {
        const { projectId, columnId, title, description, priority, tags, dueDate, subtasks, sprintId, storyPoints, dodCompletedItems, assignee, tokensConsumed, timeSpent, cost, model } = request.params
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

          if (sprintId !== undefined) newTask.sprintId = sprintId;
          if (storyPoints !== undefined) newTask.storyPoints = storyPoints;
          if (dodCompletedItems !== undefined) newTask.dodCompletedItems = dodCompletedItems;
          if (assignee !== undefined) newTask.assignee = assignee;

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
        const { projectId, taskId, title, description, priority, tags, dueDate, subtasks, newColumnId, sprintId, storyPoints, dodCompletedItems, assignee, tokensConsumed, timeSpent, cost, model } = request.params.arguments as any;
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
          
          if (sprintId !== undefined) {
            project.tasks[taskId].sprintId = (sprintId === 'backlog' || sprintId === '') ? null : sprintId;
          }
          if (storyPoints !== undefined) project.tasks[taskId].storyPoints = storyPoints;
          if (dodCompletedItems !== undefined) project.tasks[taskId].dodCompletedItems = dodCompletedItems;
          if (assignee !== undefined) project.tasks[taskId].assignee = assignee || '';
          
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

      if (request.params.name === "list_sprints") {
        const { projectId } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          return { content: [{ type: "text", text: JSON.stringify(project.sprints || []) }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error listing sprints: ${error?.message}` }] };
        }
      }

      if (request.params.name === "create_sprint") {
        const { projectId, name, startDate, endDate, goal } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          const newSprint = {
            id: `sprint-${Date.now()}`,
            name: name || `Sprint ${(project.sprints?.length || 0) + 1}`,
            startDate: startDate || '',
            endDate: endDate || '',
            goal: goal || '',
            status: 'planned',
            completedAt: null,
            burndownHistory: [],
            stats: null,
            retro: null
          };

          project.sprints = [...(project.sprints || []), newSprint];
          project.markModified('sprints');
          
          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: AI_AGENT_USER_ID,
            userName: user.email || 'Agente IA',
            action: `Created sprint "${newSprint.name}"`,
            timestamp: new Date().toISOString()
          };
          project.activityLog = [logEntry, ...(project.activityLog || [])].slice(0, 100);
          project.markModified('activityLog');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Sprint successfully created. Sprint ID: ${newSprint.id}` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error creating sprint: ${error?.message}` }] };
        }
      }

      if (request.params.name === "update_sprint") {
        const { projectId, sprintId, name, startDate, endDate, goal, status, retro } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          let sprintFound = false;
          project.sprints = (project.sprints || []).map((s: any) => {
            if (s.id === sprintId) {
              sprintFound = true;
              const updated = { ...s };
              if (name !== undefined) updated.name = name;
              if (startDate !== undefined) updated.startDate = startDate;
              if (endDate !== undefined) updated.endDate = endDate;
              if (goal !== undefined) updated.goal = goal;
              if (retro !== undefined) updated.retro = retro;
              
              if (status !== undefined) {
                if (status === 'active' && s.status !== 'active') {
                  const sprintTasks = Object.values(project.tasks || {}).filter((t: any) => t.sprintId === sprintId);
                  const totalSP = sprintTasks.reduce((acc: number, t: any) => acc + (t.storyPoints || 0), 0);
                  const totalTasks = sprintTasks.length;
                  
                  updated.status = 'active';
                  updated.burndownHistory = [
                    {
                      date: new Date().toISOString().split('T')[0],
                      remainingSP: totalSP,
                      remainingTasks: totalTasks
                    }
                  ];
                } else if (status === 'completed' && s.status !== 'completed') {
                  updated.status = 'completed';
                  updated.completedAt = new Date().toISOString();
                } else {
                  updated.status = status;
                }
              }
              return updated;
            }
            if (status === 'active' && s.status === 'active' && s.id !== sprintId) {
              return { ...s, status: 'completed', completedAt: new Date().toISOString() };
            }
            return s;
          });

          if (!sprintFound) {
            throw new Error(`Sprint with ID ${sprintId} not found`);
          }

          project.markModified('sprints');

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: AI_AGENT_USER_ID,
            userName: user.email || 'Agente IA',
            action: `Updated sprint "${sprintId}"`,
            timestamp: new Date().toISOString()
          };
          project.activityLog = [logEntry, ...(project.activityLog || [])].slice(0, 100);
          project.markModified('activityLog');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Sprint ${sprintId} successfully updated.` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error updating sprint: ${error?.message}` }] };
        }
      }

      if (request.params.name === "complete_sprint") {
        const { projectId, sprintId, fallbackSprintId, retro } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          const doneColId = project.doneColumnId || project.columnOrder?.[project.columnOrder.length - 1] || 'column-done';
          const sprintTasks = Object.values(project.tasks || {}).filter((t: any) => t.sprintId === sprintId);
          
          const completedTasksList = sprintTasks.filter((t: any) => t.columnId === doneColId);
          const uncompletedTasksList = sprintTasks.filter((t: any) => t.columnId !== doneColId);
          
          const plannedSP = sprintTasks.reduce((acc: number, t: any) => acc + (t.storyPoints || 0), 0);
          const completedSP = completedTasksList.reduce((acc: number, t: any) => acc + (t.storyPoints || 0), 0);
          const plannedTasksCount = sprintTasks.length;
          const completedTasksCount = completedTasksList.length;

          let sprintFound = false;
          project.sprints = (project.sprints || []).map((s: any) => {
            if (s.id === sprintId) {
              sprintFound = true;
              return {
                ...s,
                status: 'completed',
                completedAt: new Date().toISOString(),
                stats: {
                  plannedSP,
                  completedSP,
                  plannedTasks: plannedTasksCount,
                  completedTasks: completedTasksCount
                },
                retro: retro || null
              };
            }
            return s;
          });

          if (!sprintFound) {
            throw new Error(`Sprint with ID ${sprintId} not found`);
          }

          const targetFallback = (fallbackSprintId === 'backlog' || !fallbackSprintId) ? null : fallbackSprintId;
          uncompletedTasksList.forEach((t: any) => {
            if (project.tasks[t.id]) {
              project.tasks[t.id].sprintId = targetFallback;
            }
          });

          project.markModified('sprints');
          project.markModified('tasks');

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: AI_AGENT_USER_ID,
            userName: user.email || 'Agente IA',
            action: `Completed sprint "${sprintId}"`,
            timestamp: new Date().toISOString()
          };
          project.activityLog = [logEntry, ...(project.activityLog || [])].slice(0, 100);
          project.markModified('activityLog');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Sprint ${sprintId} successfully completed and uncompleted tasks rolled to ${fallbackSprintId || 'backlog'}.` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error completing sprint: ${error?.message}` }] };
        }
      }

      if (request.params.name === "update_project_dod") {
        const { projectId, definitionOfDone } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          project.definitionOfDone = definitionOfDone || [];
          
          project.markModified('definitionOfDone');

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: AI_AGENT_USER_ID,
            userName: user.email || 'Agente IA',
            action: `Updated Definition of Done checklist`,
            timestamp: new Date().toISOString()
          };
          project.activityLog = [logEntry, ...(project.activityLog || [])].slice(0, 100);
          project.markModified('activityLog');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Project Definition of Done successfully updated.` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error updating project DoD: ${error?.message}` }] };
        }
      }

      if (request.params.name === "delete_task") {
        const { projectId, taskId, columnId } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          if (!project.tasks || !project.tasks[taskId]) {
            throw new Error(`Task with ID ${taskId} not found in project`);
          }

          // Remove task from columns
          const targetColId = columnId || Object.keys(project.columns || {}).find(colId => 
            project.columns[colId].taskIds.includes(taskId)
          );

          if (targetColId && project.columns[targetColId]) {
            project.columns[targetColId].taskIds = project.columns[targetColId].taskIds.filter(
              (id: string) => id !== taskId
            );
          }

          // Delete task from tasks list
          delete project.tasks[taskId];

          project.markModified('tasks');
          project.markModified('columns');

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: AI_AGENT_USER_ID,
            userName: user.email || 'Agente IA',
            action: `Deleted task "${taskId}"`,
            timestamp: new Date().toISOString()
          };
          project.activityLog = [logEntry, ...(project.activityLog || [])].slice(0, 100);
          project.markModified('activityLog');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Task ${taskId} successfully deleted.` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error deleting task: ${error?.message}` }] };
        }
      }

      if (request.params.name === "delete_sprint") {
        const { projectId, sprintId } = request.params.arguments as any;
        try {
          const project = await this.projectsService.findOne(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL);
          
          const sprints = project.sprints || [];
          const updatedSprints = sprints.filter((s: any) => s.id !== sprintId);
          if (sprints.length === updatedSprints.length) {
            throw new Error(`Sprint with ID ${sprintId} not found`);
          }

          // Unassign sprint from tasks
          const tasks = project.tasks || {};
          Object.values(tasks).forEach((t: any) => {
            if (t.sprintId === sprintId) {
              t.sprintId = null;
            }
          });

          project.sprints = updatedSprints;
          project.markModified('sprints');
          project.markModified('tasks');

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: AI_AGENT_USER_ID,
            userName: user.email || 'Agente IA',
            action: `Deleted sprint "${sprintId}"`,
            timestamp: new Date().toISOString()
          };
          project.activityLog = [logEntry, ...(project.activityLog || [])].slice(0, 100);
          project.markModified('activityLog');

          await this.projectsService.update(projectId, AI_AGENT_USER_ID, AI_AGENT_EMAIL, project);
          return { content: [{ type: "text", text: `Sprint ${sprintId} successfully deleted.` }] };
        } catch (error: any) {
          return { isError: true, content: [{ type: "text", text: `Error deleting sprint: ${error?.message}` }] };
        }
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  async handleSse(req: Request, res: Response) {
    this.logger.log("New MCP SSE connection establishing...");

    const user = this.authenticate(req);
    if (!user) {
      res.status(401).send("Unauthorized");
      return;
    }

    const appUrl = process.env.APP_URL ?? 'https://cronowork.app';
    const baseUrl = appUrl.replace(/\/+$/, '') + '/api/mcp/messages';

    // Only echo the token into the messages URL when it arrived via query param
    // (header-based clients keep the token out of the URL entirely).
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
        // Use `?` when the endpoint has no query string yet (header-based auth,
        // no `?token=`), otherwise `&`. Getting this wrong turns `&sessionId`
        // into part of the path and the client's POST 404s.
        const sep = endpoint.includes('?') ? '&' : '?';
        chunk = `event: endpoint\ndata: ${endpoint}${sep}sessionId=${sessionId}\n\n`;
      }
      return originalWrite(chunk, ...args);
    };

    const transport = new SSEServerTransport(endpoint, res);

    const server = new Server(
      { name: "vibe-kanban-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    this.registerTools(server, user);
    await server.connect(transport);

    const sessionId = transport.sessionId;
    this.sessions.set(sessionId, { transport, server, userId: user.userId });
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

    const user = this.authenticate(req);
    if (!user) {
      res.status(401).send("Unauthorized");
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.error(`Session not found: ${sessionId}. Active sessions: ${[...this.sessions.keys()].join(', ')}`);
      res.status(404).send("Session not found");
      return;
    }

    // Bind the session to the authenticated user: a valid token for a
    // different user must not be able to drive someone else's MCP session.
    if (session.userId && session.userId !== user.userId) {
      this.logger.error(`Session ownership mismatch for session: ${sessionId}`);
      res.status(403).send("Forbidden");
      return;
    }

    this.logger.log(`Handling message for session: ${sessionId}`);
    await session.transport.handlePostMessage(req, res, req.body);
  }
}
