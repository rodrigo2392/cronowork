import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, read: false }).exec();
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const newNotification = new this.notificationModel(data);
    return newNotification.save();
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
