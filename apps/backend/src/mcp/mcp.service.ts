import { Injectable, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ProjectsService } from "../projects/projects.service";

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private sessions = new Map<
    string,
    { transport: SSEServerTransport; server: Server }
  >();

  constructor(private projectsService: ProjectsService) {}

  private registerTools(server: Server) {
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
                  description: "Task description",
                },
              },
              required: ["projectId", "columnId", "title"],
            },
          },
        ],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const AI_AGENT_USER_ID = "ai-mcp-agent-system-user";
      const AI_AGENT_EMAIL = "ai-mcp-agent@system.local";

      if (request.params.name === "list_projects") {
        const projects = await this.projectsService.findAll(AI_AGENT_USER_ID, AI_AGENT_EMAIL);
        return {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
        };
      }

      if (request.params.name === "add_task") {
        const { projectId, columnId, title, description } = request.params
          .arguments as any;

        try {
          const project = await this.projectsService.findOne(
            projectId,
            AI_AGENT_USER_ID,
            AI_AGENT_EMAIL
          );

          const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const newTask = {
            id: taskId,
            title,
            description: description || "",
            priority: "medium",
            tags: [],
            subtasks: [],
            dueDate: "",
            createdAt: new Date().toISOString(),
          };

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
            content: [
              { type: "text", text: `Error adding task: ${error?.message}` },
            ],
          };
        }
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  async handleSse(req: Request, res: Response) {
    this.logger.log("New MCP SSE connection establishing...");
    const endpoint = process.env.MCP_MESSAGES_ENDPOINT || "/mcp/messages";
    const transport = new SSEServerTransport(endpoint, res);

    const server = new Server(
      { name: "vibe-kanban-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    this.registerTools(server);
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

    if (!sessionId) {
      this.logger.error("Missing sessionId in message request");
      res.status(400).send("Missing sessionId");
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.error(`Received message for unknown session: ${sessionId}`);
      res.status(404).send("Session not found");
      return;
    }

    await session.transport.handlePostMessage(req, res);
  }
}
