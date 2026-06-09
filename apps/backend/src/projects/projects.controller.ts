import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InviteDto, SetRoleDto, ShareLinkDto } from './dto/member.dto';
import { MoveDto } from './dto/move.dto';

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

  // Lightweight drag/drop move — sends only the affected columns/tasks, not
  // the whole project (avoids "request entity too large" on large boards).
  @Patch(':id/move')
  async move(@Param('id') id: string, @Body() body: MoveDto, @Req() req: any) {
    return this.projectsService.applyMove(id, req.user.userId, req.user.email, body);
  }

  @Post(':id/invite')
  async inviteUser(
    @Param('id') id: string,
    @Body() body: InviteDto,
    @Req() req: any
  ) {
    return this.projectsService.inviteUser(id, req.user.userId, body.email, body.role, req.user.email);
  }

  // Enable / update the shareable link (owner or admin). Returns the project
  // including the new shareToken so the client can build the URL.
  @Post(':id/share-link')
  async createShareLink(
    @Param('id') id: string,
    @Body() body: ShareLinkDto,
    @Req() req: any
  ) {
    return this.projectsService.createShareLink(id, req.user.userId, req.user.email, body.role);
  }

  // Disable the shareable link (owner or admin).
  @Delete(':id/share-link')
  async revokeShareLink(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.revokeShareLink(id, req.user.userId, req.user.email);
  }

  // Join a project via its share link. Any authenticated user with a valid token.
  @Post('join/:token')
  async joinByToken(@Param('token') token: string, @Req() req: any) {
    return this.projectsService.joinByToken(token, req.user.userId, req.user.email);
  }

  @Put(':id/members/role')
  async setMemberRole(
    @Param('id') id: string,
    @Body() body: SetRoleDto,
    @Req() req: any
  ) {
    return this.projectsService.setMemberRole(id, req.user.userId, body.email, body.role, req.user.email);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user.userId);
  }
}
