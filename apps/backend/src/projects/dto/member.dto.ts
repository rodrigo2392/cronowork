import { IsEmail, IsOptional, IsIn } from 'class-validator';

export class InviteDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['admin', 'editor', 'viewer'])
  role?: string;
}

export class SetRoleDto {
  @IsEmail()
  email: string;

  @IsIn(['admin', 'editor', 'viewer'])
  role: string;
}

export class ShareLinkDto {
  @IsOptional()
  @IsIn(['admin', 'editor', 'viewer'])
  role?: string;
}
