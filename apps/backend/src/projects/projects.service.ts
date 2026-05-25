import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private usersService: UsersService,
    private notificationsService: NotificationsService
  ) {}

  async findAll(userId: string, email: string): Promise<Project[]> {
    return this.projectModel.find({ 
      $or: [{ userId }, { sharedWith: userId }, { members: email }] 
    }).exec();
  }

  async findOne(id: string, userId: string, email: string): Promise<Project> {
    const project = await this.projectModel.findOne({ 
      id, 
      $or: [{ userId }, { sharedWith: userId }, { members: email }] 
    }).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async create(userId: string, projectData: any): Promise<Project> {
    const newProject = new this.projectModel({ ...projectData, userId });
    return newProject.save();
  }

  async update(id: string, userId: string, email: string, projectData: any): Promise<Project> {
    const updatedProject = await this.projectModel
      .findOneAndUpdate(
        { id, $or: [{ userId }, { sharedWith: userId }, { members: email }] }, 
        projectData, 
        { new: true }
      )
      .exec();
    
    // Fallback: If not found, it might be a new project creation via PUT
    // But since we use PUT for upserting, we have to be careful.
    // Let's only upsert if we are the explicit owner.
    if (!updatedProject) {
       const existing = await this.projectModel.findOne({ id }).exec();
       if (existing) throw new ForbiddenException('Access denied');
       
       const newProj = new this.projectModel({ ...projectData, userId, id });
       return newProj.save();
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

  async inviteUser(projectId: string, ownerId: string, targetEmail: string): Promise<Project> {
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
    
    return project.save();
  }
}
