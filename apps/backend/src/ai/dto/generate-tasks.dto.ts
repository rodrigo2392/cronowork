import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class GenerateTasksDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  prompt: string;

  @IsString()
  @MinLength(1)
  projectId: string;

  @IsOptional()
  @IsString()
  columnId?: string;
}
