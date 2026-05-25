import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { McpService } from './mcp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
