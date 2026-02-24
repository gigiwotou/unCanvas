import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace, WorkspaceMember, WorkspaceRole } from './workspace.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto } from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string): Promise<Workspace> {
    const workspace = this.workspacesRepository.create({
      ...createWorkspaceDto,
      ownerId: userId,
    });
    const saved = await this.workspacesRepository.save(workspace);

    await this.membersRepository.save({
      workspaceId: saved.id,
      userId,
      role: WorkspaceRole.OWNER,
    });

    return saved;
  }

  async findAll(userId: string): Promise<Workspace[]> {
    const members = await this.membersRepository.find({
      where: { userId },
      relations: ['workspace', 'workspace.owner'],
    });
    return members.map(m => m.workspace);
  }

  async findOne(id: string, userId: string): Promise<Workspace> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId: id, userId },
      relations: ['workspace', 'workspace.owner'],
    });
    if (!member) {
      throw new NotFoundException('工作区不存在或无权访问');
    }
    return member.workspace;
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string): Promise<Workspace> {
    const workspace = await this.findOne(id, userId);
    const member = await this.getMember(id, userId);
    
    if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('无权限修改工作区');
    }

    Object.assign(workspace, updateWorkspaceDto);
    return this.workspacesRepository.save(workspace);
  }

  async remove(id: string, userId: string): Promise<void> {
    const workspace = await this.findOne(id, userId);
    const member = await this.getMember(id, userId);

    if (member.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('只有所有者可以删除工作区');
    }

    await this.workspacesRepository.remove(workspace);
  }

  async getMembers(workspaceId: string, userId: string): Promise<WorkspaceMember[]> {
    await this.findOne(workspaceId, userId);
    return this.membersRepository.find({
      where: { workspaceId },
      relations: ['user'],
    });
  }

  async addMember(workspaceId: string, addMemberDto: AddMemberDto, userId: string): Promise<WorkspaceMember> {
    const member = await this.getMember(workspaceId, userId);
    if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('无权限添加成员');
    }

    const existing = await this.membersRepository.findOne({
      where: { workspaceId, userId: addMemberDto.userId },
    });
    if (existing) {
      throw new ConflictException('该用户已是工作区成员');
    }

    return this.membersRepository.save({
      workspaceId,
      userId: addMemberDto.userId,
      role: addMemberDto.role,
    });
  }

  async removeMember(workspaceId: string, memberUserId: string, userId: string): Promise<void> {
    const currentMember = await this.getMember(workspaceId, userId);
    if (currentMember.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('无权限移除成员');
    }

    const targetMember = await this.membersRepository.findOne({
      where: { workspaceId, userId: memberUserId },
    });
    if (!targetMember) {
      throw new NotFoundException('成员不存在');
    }

    await this.membersRepository.remove(targetMember);
  }

  async updateMemberRole(workspaceId: string, memberUserId: string, role: WorkspaceRole, userId: string): Promise<WorkspaceMember> {
    const currentMember = await this.getMember(workspaceId, userId);
    if (currentMember.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('无权限修改成员角色');
    }

    const targetMember = await this.membersRepository.findOne({
      where: { workspaceId, userId: memberUserId },
    });
    if (!targetMember) {
      throw new NotFoundException('成员不存在');
    }

    targetMember.role = role;
    return this.membersRepository.save(targetMember);
  }

  private async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new ForbiddenException('无权访问此工作区');
    }
    return member;
  }

  async checkAccess(workspaceId: string, userId: string, minRole: WorkspaceRole = WorkspaceRole.VIEWER): Promise<boolean> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId },
    });
    if (!member) return false;

    const roleHierarchy = {
      [WorkspaceRole.VIEWER]: 1,
      [WorkspaceRole.EDITOR]: 2,
      [WorkspaceRole.ADMIN]: 3,
      [WorkspaceRole.OWNER]: 4,
    };

    return roleHierarchy[member.role] >= roleHierarchy[minRole];
  }
}
