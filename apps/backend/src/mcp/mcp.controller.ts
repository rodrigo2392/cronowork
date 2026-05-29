import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { McpService } from './mcp.service';

// No guard here: MCP authenticates manually (header preferred, ?token= fallback)
// because the SSE transport often can't send an Authorization header.
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('sse')
  async handleSse(@Req() req: Request, @Res() res: Response) {
    return this.mcpService.handleSse(req, res);
  }

  @Post('messages')
  async handleMessages(@Req() req: Request, @Res() res: Response) {
    return this.mcpService.handleMessages(req, res);
  }
}
