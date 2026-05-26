import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus() {
    return { isConfigured: !!process.env.OPENAI_API_KEY };
  }

  @Post('generate')
  async generateTasks(
    @Req() req: Request,
    @Body('prompt') prompt: string,
    @Body('projectId') projectId: string,
    @Body('columnId') columnId?: string,
  ) {
    const user = req.user as any;
    return this.aiService.generateAndInjectTasks(prompt, projectId, user.id, user.email, columnId);
  }
}
