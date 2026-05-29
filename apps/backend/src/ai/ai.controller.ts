import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { GenerateTasksDto } from './dto/generate-tasks.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus() {
    return { isConfigured: !!process.env.OPENAI_API_KEY };
  }

  @Post('generate')
  async generateTasks(@Req() req: Request, @Body() body: GenerateTasksDto) {
    const user = req.user as any;
    return this.aiService.generateAndInjectTasks(
      body.prompt,
      body.projectId,
      user.userId,
      user.email,
      body.columnId,
    );
  }
}
