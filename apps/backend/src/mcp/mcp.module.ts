import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ProjectsModule,
    NotificationsModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured. Refusing to start.');
        }
        return { secret };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
