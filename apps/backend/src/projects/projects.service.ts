import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // Builds an ownership/access filter, skipping any undefined/empty identity
  // values (avoids Mongoose dropping `{ userId: undefined }` -> match-all).
  private accessOr(userId?: string, email?: string): any[] {
    const or: any[] = [];
    if (userId) or.push({ userId }, { sharedWith: userId });
    if (email) or.push({ members: email });
    return or;
  }

  async findAll(userId: string, email: string): Promise<Project[]> {
    const or = this.accessOr(userId, email);
    if (or.length === 0) return [];
    return this.projectModel.find({ $or: or }).exec();
  }

  async findOne(id: string, userId: string, email: string): Promise<Project> {
    const or = this.accessOr(userId, email);
    if (or.length === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    const project = await this.projectModel.findOne({ id, $or: or }).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async create(userId: string, projectData: any): Promise<Project> {
    const newProject = new this.projectModel({ ...projectData, userId });
    return newProject.save();
  }

  // Fields a caller is allowed to mutate via update(). Notably excludes
  // userId, sharedWith, members (ownership/ACL) to prevent privilege escalation.
  private static readonly UPDATABLE_FIELDS = [
    'name', 'description', 'prefix', 'icon', 'tasks', 'columns', 'columnOrder',
    'doneColumnId', 'autoArchiveDays', 'notifySettings', 'activityLog',
  ];

  async update(id: string, userId: string, email: string, projectData: any): Promise<Project> {
    const or = this.accessOr(userId, email);
    if (or.length === 0) throw new ForbiddenException('Access denied');

    let project = await this.projectModel.findOne({ id, $or: or }).exec();

    if (!project) {
      // Fallback: If not found, it might be a new project creation via PUT
      const existing = await this.projectModel.findOne({ id }).exec();
      if (existing) throw new ForbiddenException('Access denied');

      project = new this.projectModel({ ...projectData, userId, id });
    } else {
      // Read-only members (role 'viewer') cannot mutate the project.
      const isOwner = project.userId === userId;
      if (!isOwner && project.roles && project.roles[email] === 'viewer') {
        throw new ForbiddenException('You have read-only access to this project');
      }

      // Extract raw data if it's a mongoose document
      const rawData = typeof projectData.toObject === 'function' ? projectData.toObject() : projectData;

      // Only assign whitelisted fields. Ownership/ACL fields (userId,
      // sharedWith, members) and immutable fields (_id, id, __v) are ignored.
      for (const key of ProjectsService.UPDATABLE_FIELDS) {
        if (rawData[key] !== undefined) {
          (project as any)[key] = rawData[key];
        }
      }
    }

    project.markModified('tasks');
    project.markModified('columns');
    project.markModified('activityLog');
    
    const updatedProject = await project.save();

    if (updatedProject) {
      this.eventsGateway.emitToUser(updatedProject.userId, 'project_updated', { projectId: updatedProject.id });
      if (updatedProject.sharedWith && Array.isArray(updatedProject.sharedWith)) {
        updatedProject.sharedWith.forEach(uid => {
          this.eventsGateway.emitToUser(uid, 'project_updated', { projectId: updatedProject.id });
        });
      }
    }
    
    return updatedProject;
  }

  async remove(id: string, userId: string): Promise<void> {
    // Only the explicit owner can delete
    const project = await this.projectModel.findOne({ id }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.projectModel.deleteOne({ id, userId }).exec();
  }

  async inviteUser(projectId: string, ownerId: string, targetEmail: string, role: string = 'editor'): Promise<Project> {
    const safeRole = role === 'viewer' ? 'viewer' : 'editor';
    const project = await this.projectModel.findOne({ id: projectId }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== ownerId) {
      throw new ForbiddenException('Only the project owner can invite users');
    }

    const targetUser = await this.usersService.findByEmail(targetEmail);

    if (targetUser) {
      const targetUserId = targetUser._id.toString();
      if (project.userId === targetUserId || project.sharedWith.includes(targetUserId)) {
        throw new BadRequestException('User is already part of this project');
      }
      project.sharedWith.push(targetUserId);

      // Create notification
      await this.notificationsService.create({
        userId: targetUserId,
        title: 'Project Invitation',
        message: `You have been invited to join the project "${project.name}"`,
        type: 'INVITE',
        projectId: project.id
      });
    }

    if (!project.members) {
      project.members = [];
    }
    if (!project.members.includes(targetEmail)) {
      project.members.push(targetEmail);
    } else if (!targetUser) {
      throw new BadRequestException('User is already invited to this project');
    }

    project.roles = { ...(project.roles || {}), [targetEmail]: safeRole };
    project.markModified('roles');

    return project.save();
  }

  // Owner-only: change a member's access role ('editor' | 'viewer').
  async setMemberRole(projectId: string, ownerId: string, targetEmail: string, role: string): Promise<Project> {
    const safeRole = role === 'viewer' ? 'viewer' : 'editor';
    const project = await this.projectModel.findOne({ id: projectId }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== ownerId) {
      throw new ForbiddenException('Only the project owner can change member roles');
    }
    if (!project.members || !project.members.includes(targetEmail)) {
      throw new BadRequestException('User is not a member of this project');
    }

    project.roles = { ...(project.roles || {}), [targetEmail]: safeRole };
    project.markModified('roles');
    const saved = await project.save();

    // Notify the affected user (if registered) so their UI refreshes access.
    const targetUser = await this.usersService.findByEmail(targetEmail);
    if (targetUser) {
      this.eventsGateway.emitToUser(targetUser._id.toString(), 'project_updated', { projectId: project.id });
    }
    this.eventsGateway.emitToUser(project.userId, 'project_updated', { projectId: project.id });

    return saved;
  }
}
