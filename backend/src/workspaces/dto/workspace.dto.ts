import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '../workspace.entity';

export class CreateWorkspaceDto {
  @ApiProperty({ example: '我的工作区' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '这是一个工作区描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: '新名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '新描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  config?: Record<string, any>;
}

export class AddMemberDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.EDITOR })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: WorkspaceRole, example: WorkspaceRole.ADMIN })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
