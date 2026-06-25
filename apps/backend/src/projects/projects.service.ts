import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
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
    'doneColumnId', 'autoArchiveEnabled', 'autoArchiveDays', 'autoDeleteArchivedDays',
    'defaultPriority', 'defaultTags', 'defaultAssignee', 'autoStartTimer',
    'aiEnabled', 'notifySettings', 'activityLog',
    'sprints', 'definitionOfDone',
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

  // Applies a minimal drag/drop move without re-sending the whole project.
  // Only the affected columns' taskIds, an optional new columnOrder, partial
  // task field updates, and an optional activity entry are touched.
  async applyMove(id: string, userId: string, email: string, move: any): Promise<{ ok: true }> {
    const or = this.accessOr(userId, email);
    if (or.length === 0) throw new ForbiddenException('Access denied');

    const project = await this.projectModel.findOne({ id, $or: or }).exec();
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    // Read-only members (role 'viewer') cannot mutate the project.
    const isOwner = project.userId === userId;
    if (!isOwner && project.roles && project.roles[email] === 'viewer') {
      throw new ForbiddenException('You have read-only access to this project');
    }

    if (move.columns && typeof move.columns === 'object') {
      const columns = { ...(project.columns || {}) };
      for (const [colId, taskIds] of Object.entries(move.columns)) {
        if (!columns[colId] || !Array.isArray(taskIds)) continue; // ignore unknown columns / bad payloads
        columns[colId] = { ...columns[colId], taskIds };
      }
      project.columns = columns;
      project.markModified('columns');
    }

    if (Array.isArray(move.columnOrder)) {
      project.columnOrder = move.columnOrder;
    }

    if (move.taskUpdates && typeof move.taskUpdates === 'object') {
      const tasks = { ...(project.tasks || {}) };
      for (const [taskId, patch] of Object.entries(move.taskUpdates)) {
        if (!tasks[taskId] || !patch || typeof patch !== 'object') continue; // only patch existing tasks
        tasks[taskId] = { ...tasks[taskId], ...patch };
      }
      project.tasks = tasks;
      project.markModified('tasks');
    }

    if (move.activity && move.activity.text) {
      const log = Array.isArray(project.activityLog) ? project.activityLog : [];
      project.activityLog = [move.activity, ...log].slice(0, 50);
      project.markModified('activityLog');
    }

    const saved = await project.save();

    this.eventsGateway.emitToUser(saved.userId, 'project_updated', { projectId: saved.id });
    if (Array.isArray(saved.sharedWith)) {
      saved.sharedWith.forEach(uid => {
        this.eventsGateway.emitToUser(uid, 'project_updated', { projectId: saved.id });
      });
    }

    return { ok: true };
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

  private static readonly VALID_ROLES = ['admin', 'editor', 'viewer'];
  private static normalizeRole(role: string): string {
    return ProjectsService.VALID_ROLES.includes(role) ? role : 'editor';
  }
  // The owner, or a member with the 'admin' role, may manage members/roles.
  private static canManageMembers(project: any, requesterId: string, requesterEmail: string): boolean {
    return project.userId === requesterId || project.roles?.[requesterEmail] === 'admin';
  }

  async inviteUser(projectId: string, requesterId: string, targetEmail: string, role: string = 'editor', requesterEmail: string = ''): Promise<Project> {
    const safeRole = ProjectsService.normalizeRole(role);
    const project = await this.projectModel.findOne({ id: projectId }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (!ProjectsService.canManageMembers(project, requesterId, requesterEmail)) {
      throw new ForbiddenException('Only the project owner or an admin can invite users');
    }

    const targetUser = await this.usersService.findByEmail(targetEmail);

    // The email stored in members/roles must equal the email carried in the
    // invitee's JWT (which comes from their stored user record). For registered
    // users we use their canonical stored email; otherwise we normalize the
    // typed value so a future registration with the same email matches.
    const memberEmail = targetUser
      ? targetUser.email
      : targetEmail.trim().toLowerCase();

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
    if (!project.members.includes(memberEmail)) {
      project.members.push(memberEmail);
    } else if (!targetUser) {
      throw new BadRequestException('User is already invited to this project');
    }

    project.roles = { ...(project.roles || {}), [memberEmail]: safeRole };
    project.markModified('roles');

    const saved = await project.save();

    // Push a live refresh so an already-connected invitee sees the project
    // immediately, without a manual reload. (Mirrors setMemberRole.)
    if (targetUser) {
      this.eventsGateway.emitToUser(targetUser._id.toString(), 'project_updated', { projectId: saved.id });
    }

    return saved;
  }

  // Owner or admin: change a member's access role ('admin' | 'editor' | 'viewer').
  async setMemberRole(projectId: string, requesterId: string, targetEmail: string, role: string, requesterEmail: string = ''): Promise<Project> {
    const safeRole = ProjectsService.normalizeRole(role);
    const project = await this.projectModel.findOne({ id: projectId }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (!ProjectsService.canManageMembers(project, requesterId, requesterEmail)) {
      throw new ForbiddenException('Only the project owner or an admin can change member roles');
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

  // Owner or admin: enable (or update the role of) the shareable link. Generates
  // a token on first call and reuses it afterwards so existing links stay valid.
  async createShareLink(projectId: string, requesterId: string, requesterEmail: string, role: string = 'editor'): Promise<Project> {
    const safeRole = ProjectsService.normalizeRole(role);
    const project = await this.projectModel.findOne({ id: projectId }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (!ProjectsService.canManageMembers(project, requesterId, requesterEmail)) {
      throw new ForbiddenException('Only the project owner or an admin can manage the share link');
    }

    if (!project.shareToken) {
      project.shareToken = randomBytes(24).toString('hex');
    }
    project.shareRole = safeRole;
    return project.save();
  }

  // Owner or admin: disable the link. Existing links stop working immediately.
  async revokeShareLink(projectId: string, requesterId: string, requesterEmail: string): Promise<Project> {
    const project = await this.projectModel.findOne({ id: projectId }).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (!ProjectsService.canManageMembers(project, requesterId, requesterEmail)) {
      throw new ForbiddenException('Only the project owner or an admin can manage the share link');
    }

    project.shareToken = undefined;
    return project.save();
  }

  // Any authenticated user with a valid link joins the project at shareRole.
  // Idempotent: owners/existing members just get the project back unchanged.
  async joinByToken(token: string, userId: string, email: string): Promise<Project> {
    if (!token || typeof token !== 'string') throw new NotFoundException('Invalid share link');
    const project = await this.projectModel.findOne({ shareToken: token }).exec();
    if (!project) throw new NotFoundException('This share link is invalid or has been revoked');

    const alreadyMember =
      project.userId === userId ||
      (project.sharedWith || []).includes(userId) ||
      (email && (project.members || []).includes(email));
    if (alreadyMember) return project;

    const safeRole = ProjectsService.normalizeRole(project.shareRole || 'editor');

    if (!project.sharedWith.includes(userId)) {
      project.sharedWith.push(userId);
    }
    if (!project.members) project.members = [];
    if (email && !project.members.includes(email)) {
      project.members.push(email);
    }
    if (email) {
      project.roles = { ...(project.roles || {}), [email]: safeRole };
      project.markModified('roles');
    }

    const saved = await project.save();

    // Refresh the owner (and any other members) so the new member appears live.
    this.eventsGateway.emitToUser(saved.userId, 'project_updated', { projectId: saved.id });
    return saved;
  }
}
