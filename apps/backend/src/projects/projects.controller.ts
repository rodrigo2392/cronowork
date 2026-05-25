import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user.userId, req.user.email);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(id, req.user.userId, req.user.email);
  }

  @Post()
  async create(@Body() projectData: any, @Req() req: any) {
    return this.projectsService.create(req.user.userId, projectData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() projectData: any, @Req() req: any) {
    return this.projectsService.update(id, req.user.userId, req.user.email, projectData);
  }

  @Post(':id/invite')
  async inviteUser(
    @Param('id') id: string, 
    @Body('email') email: string, 
    @Req() req: any
  ) {
    return this.projectsService.inviteUser(id, req.user.userId, email);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user.userId);
  }
}
