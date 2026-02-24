import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CanvasService } from './canvas.service';
import { CreateCanvasDto, UpdateCanvasDto, CreateStoryboardDto, UpdateStoryboardDto, CreateCardDto, UpdateCardDto } from './dto/canvas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('画布')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Post('workspaces/:workspaceId/canvases')
  @ApiOperation({ summary: '创建画布' })
  create(@Param('workspaceId') workspaceId: string, @Body() createCanvasDto: CreateCanvasDto, @Request() req) {
    return this.canvasService.create(createCanvasDto, workspaceId, req.user.id);
  }

  @Get('workspaces/:workspaceId/canvases')
  @ApiOperation({ summary: '获取工作区所有画布' })
  findAllByWorkspace(@Param('workspaceId') workspaceId: string, @Request() req) {
    return this.canvasService.findAllByWorkspace(workspaceId, req.user.id);
  }

  @Get('canvases/:id')
  @ApiOperation({ summary: '获取画布' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.canvasService.findOne(id, req.user.id);
  }

  @Patch('canvases/:id')
  @ApiOperation({ summary: '更新画布' })
  update(@Param('id') id: string, @Body() updateCanvasDto: UpdateCanvasDto, @Request() req) {
    return this.canvasService.update(id, updateCanvasDto, req.user.id);
  }

  @Delete('canvases/:id')
  @ApiOperation({ summary: '删除画布' })
  remove(@Param('id') id: string, @Request() req) {
    return this.canvasService.remove(id, req.user.id);
  }

  @Get('canvases/:id/full')
  @ApiOperation({ summary: '获取完整画布数据（含分镜和卡片）' })
  getFullData(@Param('id') id: string, @Request() req) {
    return this.canvasService.getFullCanvasData(id, req.user.id);
  }

  @Post('storyboards')
  @ApiOperation({ summary: '创建分镜' })
  createStoryboard(@Body() dto: CreateStoryboardDto, @Request() req) {
    return this.canvasService.createStoryboard(dto, req.user.id);
  }

  @Get('canvases/:canvasId/storyboards')
  @ApiOperation({ summary: '获取画布所有分镜' })
  findStoryboards(@Param('canvasId') canvasId: string, @Request() req) {
    return this.canvasService.findStoryboards(canvasId, req.user.id);
  }

  @Patch('storyboards/:id')
  @ApiOperation({ summary: '更新分镜' })
  updateStoryboard(@Param('id') id: string, @Body() dto: UpdateStoryboardDto, @Request() req) {
    return this.canvasService.updateStoryboard(id, dto, req.user.id);
  }

  @Delete('storyboards/:id')
  @ApiOperation({ summary: '删除分镜' })
  removeStoryboard(@Param('id') id: string, @Request() req) {
    return this.canvasService.removeStoryboard(id, req.user.id);
  }

  @Post('cards')
  @ApiOperation({ summary: '创建卡片' })
  createCard(@Body() dto: CreateCardDto, @Request() req) {
    return this.canvasService.createCard(dto, req.user.id);
  }

  @Get('storyboards/:storyboardId/cards')
  @ApiOperation({ summary: '获取分镜所有卡片' })
  findCards(@Param('storyboardId') storyboardId: string, @Request() req) {
    return this.canvasService.findCards(storyboardId, req.user.id);
  }

  @Patch('cards/:id')
  @ApiOperation({ summary: '更新卡片' })
  updateCard(@Param('id') id: string, @Body() dto: UpdateCardDto, @Request() req) {
    return this.canvasService.updateCard(id, dto, req.user.id);
  }

  @Delete('cards/:id')
  @ApiOperation({ summary: '删除卡片' })
  removeCard(@Param('id') id: string, @Request() req) {
    return this.canvasService.removeCard(id, req.user.id);
  }
}
