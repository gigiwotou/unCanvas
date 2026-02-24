import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto, UpdateMemberRoleDto } from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRole } from './workspace.entity';

@ApiTags('工作区')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: '创建工作区' })
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.create(createWorkspaceDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取用户所有工作区' })
  findAll(@Request() req) {
    return this.workspacesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定工作区' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.workspacesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新工作区' })
  update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto, @Request() req) {
    return this.workspacesService.update(id, updateWorkspaceDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工作区' })
  remove(@Param('id') id: string, @Request() req) {
    return this.workspacesService.remove(id, req.user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '获取工作区成员' })
  getMembers(@Param('id') id: string, @Request() req) {
    return this.workspacesService.getMembers(id, req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: '添加工作区成员' })
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.workspacesService.addMember(id, addMemberDto, req.user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '移除工作区成员' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.workspacesService.removeMember(id, userId, req.user.id);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: '更新成员角色' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateMemberRoleDto,
    @Request() req,
  ) {
    return this.workspacesService.updateMemberRole(id, userId, updateDto.role, req.user.id);
  }
}
