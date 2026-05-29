import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { Project } from '../projects/schemas/project.schema';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // Per-project notification preferences. Invites always notify. A project
  // with `muted` blocks everything else; assign/mention can be toggled off.
  private async isNotificationAllowed(data: Partial<Notification>): Promise<boolean> {
    if (!data.projectId || data.type === 'INVITE') return true;
    const project = await this.projectModel
      .findOne({ id: data.projectId }, { notifySettings: 1 })
      .exec();
    const s: any = project?.notifySettings;
    if (!s) return true; // no settings => everything enabled
    if (s.muted) return false;
    if (data.type === 'ASSIGN' && s.assign === false) return false;
    if (data.type === 'MENTION' && s.mention === false) return false;
    return true;
  }

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, read: false }).exec();
  }

  async create(data: Partial<Notification>): Promise<Notification | null> {
    if (!(await this.isNotificationAllowed(data))) {
      return null;
    }
    const newNotification = new this.notificationModel(data);
    const saved = await newNotification.save();
    
    // Emit real-time notification
    if (saved.userId) {
      this.eventsGateway.emitToUser(saved.userId, 'notification_created', saved);
    }
    
    return saved;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    ).exec();
    
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationModel.updateMany(
      { userId, read: false },
      { read: true }
    ).exec();
    return { updated: result.modifiedCount };
  }
}
