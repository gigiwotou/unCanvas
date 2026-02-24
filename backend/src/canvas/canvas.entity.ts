import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity('canvases')
export class Canvas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  viewport: { x: number; y: number; zoom: number };

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('storyboards')
export class Storyboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  canvasId: string;

  @ManyToOne(() => Canvas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canvasId' })
  canvas: Canvas;

  @Column()
  title: string;

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'float', default: 800 })
  width: number;

  @Column({ type: 'float', default: 600 })
  height: number;

  @Column({ type: 'text', nullable: true })
  scriptText: string;

  @Column({ nullable: true })
  characterReferenceImage: string;

  @Column({ nullable: true })
  sceneReferenceImage: string;

  @Column({ type: 'jsonb', nullable: true })
  connections: Array<{ from: string; to: string }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storyboardId: string;

  @ManyToOne(() => Storyboard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storyboardId' })
  storyboard: Storyboard;

  @Column({ default: 'image' })
  type: 'image' | 'player';

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'float', default: 288 })
  width: number;

  @Column({ type: 'float', default: 200 })
  height: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  cameraMovement: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isLoading: boolean;

  @Column({ default: false })
  isReady: boolean;

  @Column({ default: false })
  isPlaying: boolean;

  @Column({ type: 'jsonb', nullable: true })
  playlist: Array<{ id: string; imageUrl: string }>;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  currentFrame: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
