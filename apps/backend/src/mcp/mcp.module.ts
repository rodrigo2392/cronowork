import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ProjectsModule, NotificationsModule, UsersModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
