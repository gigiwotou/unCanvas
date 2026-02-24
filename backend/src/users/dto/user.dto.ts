import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '张三' })
  @IsString()
  name: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: '张三' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
