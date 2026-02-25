import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModelProvider } from './model-config.entity';
import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateModelConfigDto {
  @ApiProperty({ example: 'Gemini Pro' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ModelProvider })
  @IsEnum(ModelProvider)
  provider: ModelProvider;

  @ApiProperty({ example: 'your-api-key' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional({ example: 'gemini-2.0-flash-exp' })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

class UpdateModelConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

class GenerateStoryboardDto {
  @ApiProperty({ example: '一个侦探故事，分6个镜头' })
  @IsString()
  prompt: string;

  @ApiProperty()
  @IsString()
  modelConfigId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  characterImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sceneImage?: string;
}

class GenerateImageDto {
  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiProperty()
  @IsString()
  modelConfigId: string;
}

class ModifyImageDto {
  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty()
  @IsString()
  instruction: string;

  @ApiProperty()
  @IsString()
  modelConfigId: string;
}

@ApiTags('模型管理')
@Controller('models')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post('configs')
  @ApiOperation({ summary: '创建模型配置' })
  async createConfig(@Body() dto: CreateModelConfigDto) {
    const config = await this.modelsService.createConfig(dto);
    await this.modelsService.initializeAdapter(config);
    return config;
  }

  @Get('configs')
  @ApiOperation({ summary: '获取所有模型配置' })
  async findAllConfigs() {
    const configs = await this.modelsService.findAllConfigs();
    return configs.map(c => ({
      ...c,
      apiKey: '****' + c.apiKey.slice(-4),
    }));
  }

  @Get('configs/:id')
  @ApiOperation({ summary: '获取指定模型配置' })
  async findConfig(@Param('id') id: string) {
    const config = await this.modelsService.findConfig(id);
    return {
      ...config,
      apiKey: '****' + config.apiKey.slice(-4),
    };
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: '更新模型配置' })
  async updateConfig(@Param('id') id: string, @Body() dto: UpdateModelConfigDto) {
    const config = await this.modelsService.updateConfig(id, dto);
    if (dto.apiKey) {
      await this.modelsService.initializeAdapter(config);
    }
    return {
      ...config,
      apiKey: '****' + config.apiKey.slice(-4),
    };
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: '删除模型配置' })
  async deleteConfig(@Param('id') id: string) {
    return this.modelsService.deleteConfig(id);
  }

  @Post('generate-storyboard')
  @ApiOperation({ summary: '生成剧本分镜' })
  async generateStoryboard(@Body() dto: GenerateStoryboardDto) {
    return this.modelsService.generateStoryboard(
      dto.prompt,
      dto.modelConfigId,
      dto.characterImage,
      dto.sceneImage,
    );
  }

  @Post('generate-image')
  @ApiOperation({ summary: '生成图片' })
  async generateImage(@Body() dto: GenerateImageDto) {
    const imageUrl = await this.modelsService.generateImage(dto.prompt, dto.modelConfigId);
    return { imageUrl };
  }

  @Post('modify-image')
  @ApiOperation({ summary: '修改图片' })
  async modifyImage(@Body() dto: ModifyImageDto) {
    const imageUrl = await this.modelsService.modifyImage(
      dto.imageUrl,
      dto.instruction,
      dto.modelConfigId,
    );
    return { imageUrl };
  }
}
