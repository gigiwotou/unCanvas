import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Canvas, Storyboard, Card } from './canvas.entity';
import { CreateCanvasDto, UpdateCanvasDto, CreateStoryboardDto, UpdateStoryboardDto, CreateCardDto, UpdateCardDto } from './dto/canvas.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceRole, WorkspaceMember } from '../workspaces/workspace.entity';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(Canvas)
    private canvasRepository: Repository<Canvas>,
    @InjectRepository(Storyboard)
    private storyboardRepository: Repository<Storyboard>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
    private workspacesService: WorkspacesService,
  ) {}

  async create(createCanvasDto: CreateCanvasDto, workspaceId: string, userId: string): Promise<Canvas> {
    const hasAccess = await this.workspacesService.checkAccess(
      workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限在此工作区创建画布');
    }

    const canvas = this.canvasRepository.create({
      ...createCanvasDto,
      workspaceId,
      ownerId: userId,
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    return this.canvasRepository.save(canvas);
  }

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Canvas[]> {
    await this.workspacesService.findOne(workspaceId, userId);
    return this.canvasRepository.find({
      where: { workspaceId },
      relations: ['owner'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Canvas> {
    const canvas = await this.canvasRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });
    if (!canvas) {
      throw new NotFoundException('画布不存在');
    }

    const hasAccess = await this.workspacesService.checkAccess(
      canvas.workspaceId,
      userId,
      WorkspaceRole.VIEWER,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限访问此画布');
    }

    return canvas;
  }

  async update(id: string, updateCanvasDto: UpdateCanvasDto, userId: string): Promise<Canvas> {
    const canvas = await this.findOne(id, userId);
    const hasAccess = await this.workspacesService.checkAccess(
      canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限修改此画布');
    }

    Object.assign(canvas, updateCanvasDto);
    return this.canvasRepository.save(canvas);
  }

  async remove(id: string, userId: string): Promise<void> {
    const canvas = await this.findOne(id, userId);
    const hasAccess = await this.workspacesService.checkAccess(
      canvas.workspaceId,
      userId,
      WorkspaceRole.ADMIN,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限删除此画布');
    }

    await this.canvasRepository.remove(canvas);
  }

  async createStoryboard(dto: CreateStoryboardDto, userId: string): Promise<Storyboard> {
    const canvas = await this.findOne(dto.canvasId, userId);
    const hasAccess = await this.workspacesService.checkAccess(
      canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限添加分镜');
    }

    const storyboard = this.storyboardRepository.create({
      ...dto,
      connections: [],
    });
    return this.storyboardRepository.save(storyboard);
  }

  async findStoryboards(canvasId: string, userId: string): Promise<Storyboard[]> {
    await this.findOne(canvasId, userId);
    return this.storyboardRepository.find({
      where: { canvasId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateStoryboard(id: string, dto: UpdateStoryboardDto, userId: string): Promise<Storyboard> {
    const storyboard = await this.storyboardRepository.findOne({
      where: { id },
      relations: ['canvas'],
    });
    if (!storyboard) {
      throw new NotFoundException('分镜不存在');
    }

    const hasAccess = await this.workspacesService.checkAccess(
      storyboard.canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限修改分镜');
    }

    Object.assign(storyboard, dto);
    return this.storyboardRepository.save(storyboard);
  }

  async removeStoryboard(id: string, userId: string): Promise<void> {
    const storyboard = await this.storyboardRepository.findOne({
      where: { id },
      relations: ['canvas'],
    });
    if (!storyboard) {
      throw new NotFoundException('分镜不存在');
    }

    const hasAccess = await this.workspacesService.checkAccess(
      storyboard.canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限删除分镜');
    }

    await this.storyboardRepository.remove(storyboard);
  }

  async createCard(dto: CreateCardDto, userId: string): Promise<Card> {
    const storyboard = await this.storyboardRepository.findOne({
      where: { id: dto.storyboardId },
      relations: ['canvas'],
    });
    if (!storyboard) {
      throw new NotFoundException('分镜不存在');
    }

    const hasAccess = await this.workspacesService.checkAccess(
      storyboard.canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限添加卡片');
    }

    const card = this.cardRepository.create(dto);
    return this.cardRepository.save(card);
  }

  async findCards(storyboardId: string, userId: string): Promise<Card[]> {
    const storyboard = await this.storyboardRepository.findOne({
      where: { id: storyboardId },
      relations: ['canvas'],
    });
    if (!storyboard) {
      throw new NotFoundException('分镜不存在');
    }

    await this.workspacesService.findOne(storyboard.canvas.workspaceId, userId);
    return this.cardRepository.find({
      where: { storyboardId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateCard(id: string, dto: UpdateCardDto, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['storyboard', 'storyboard.canvas'],
    });
    if (!card) {
      throw new NotFoundException('卡片不存在');
    }

    const hasAccess = await this.workspacesService.checkAccess(
      card.storyboard.canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限修改卡片');
    }

    Object.assign(card, dto);
    return this.cardRepository.save(card);
  }

  async removeCard(id: string, userId: string): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['storyboard', 'storyboard.canvas'],
    });
    if (!card) {
      throw new NotFoundException('卡片不存在');
    }

    const hasAccess = await this.workspacesService.checkAccess(
      card.storyboard.canvas.workspaceId,
      userId,
      WorkspaceRole.EDITOR,
    );
    if (!hasAccess) {
      throw new ForbiddenException('无权限删除卡片');
    }

    await this.cardRepository.remove(card);
  }

  async getFullCanvasData(canvasId: string, userId: string) {
    const canvas = await this.findOne(canvasId, userId);
    const storyboards = await this.storyboardRepository.find({
      where: { canvasId },
    });

    const storyboardIds = storyboards.map(s => s.id);
    const cards = storyboardIds.length > 0
      ? await this.cardRepository.find({
          where: { storyboardId: In(storyboardIds) },
        })
      : [];

    const cardsByStoryboard = cards.reduce((acc, card) => {
      if (!acc[card.storyboardId]) {
        acc[card.storyboardId] = [];
      }
      acc[card.storyboardId].push(card);
      return acc;
    }, {} as Record<string, Card[]>);

    const member = await this.membersRepository.findOne({
      where: { workspaceId: canvas.workspaceId, userId },
    });

    return {
      canvas,
      userRole: member?.role || 'viewer',
      storyboards: storyboards.map(s => ({
        ...s,
        cards: cardsByStoryboard[s.id] || [],
      })),
    };
  }
}
