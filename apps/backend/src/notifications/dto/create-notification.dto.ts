import { IsString, IsOptional, IsEmail, IsIn, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsEmail()
  targetEmail?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsIn(['INVITE', 'ASSIGN', 'MENTION', 'SYSTEM'])
  type?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}
