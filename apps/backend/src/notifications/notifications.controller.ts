import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { BadRequestException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async getNotifications(@Request() req) {
    const userId = req.user.userId;
    const notifications = await this.notificationsService.findAllForUser(userId);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    return { notifications, unreadCount };
  }

  @Post()
  async createNotification(@Request() req, @Body() data: CreateNotificationDto) {
    let targetUserId = data.targetUserId;
    if (!targetUserId && data.targetEmail) {
      const user = await this.usersService.findByEmail(data.targetEmail);
      if (user) {
        targetUserId = user._id.toString();
      }
    }
    if (!targetUserId) {
      throw new BadRequestException('Target user not found');
    }

    return this.notificationsService.create({
      userId: targetUserId,
      title: data.title,
      message: data.message,
      type: data.type || 'SYSTEM',
      projectId: data.projectId,
      taskId: data.taskId
    });
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}
