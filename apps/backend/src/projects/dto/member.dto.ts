import { IsEmail, IsOptional, IsIn } from 'class-validator';

export class InviteDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['editor', 'viewer'])
  role?: string;
}

export class SetRoleDto {
  @IsEmail()
  email: string;

  @IsIn(['editor', 'viewer'])
  role: string;
}
