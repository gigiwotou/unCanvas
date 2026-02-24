import { IsString, IsOptional, IsNumber, IsObject, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCanvasDto {
  @ApiProperty({ example: '我的画布' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '画布描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCanvasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  viewport?: { x: number; y: number; zoom: number };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class CreateStoryboardDto {
  @ApiProperty()
  @IsString()
  canvasId: string;

  @ApiProperty({ example: '分镜 1' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsNumber()
  height?: number;
}

export class UpdateStoryboardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scriptText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  characterReferenceImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sceneReferenceImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  connections?: Array<{ from: string; to: string }>;
}

export class CreateCardDto {
  @ApiProperty()
  @IsString()
  storyboardId: string;

  @ApiPropertyOptional({ enum: ['image', 'player'] })
  @IsOptional()
  @IsEnum(['image', 'player'])
  type?: 'image' | 'player';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cameraMovement?: string;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cameraMovement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isLoading?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  isReady?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  isPlaying?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  playlist?: Array<{ id: string; imageUrl: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentFrame?: number;
}
