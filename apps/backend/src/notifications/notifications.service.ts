import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, read: false }).exec();
  }

  async create(data: Partial<Notification>): Promise<Notification> {
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
