import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

class UploadBase64Dto {
  data: string;
  type: 'character' | 'scene' | 'generated';
}

@ApiTags('文件上传')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('base64')
  @ApiOperation({ summary: '上传Base64图片' })
  async uploadBase64(@Body() dto: UploadBase64Dto) {
    const result = await this.uploadService.uploadBase64Image(dto.data, dto.type);
    return { url: result.url };
  }

  @Post('url')
  @ApiOperation({ summary: '从URL下载图片并存储' })
  async uploadFromUrl(@Body() dto: { url: string; type: string }) {
    try {
      const response = await fetch(dto.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';
      const ext = contentType.split('/')[1] || 'png';
      const filename = `${dto.type}-${Date.now()}.${ext}`;
      
      const result = await this.uploadService.uploadFile(buffer, filename, contentType);
      return { url: result.url };
    } catch (error) {
      throw new Error('Failed to download image from URL');
    }
  }
}
