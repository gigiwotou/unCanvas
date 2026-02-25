import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ModelProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  VERTEX = 'vertex',
  AI302 = 'ai302',
}

export enum ModelType {
  TEXT = 'text',
  IMAGE = 'image',
}

@Entity('model_configs')
export class ModelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ModelProvider })
  provider: ModelProvider;

  @Column()
  apiKey: string;

  @Column({ nullable: true })
  apiUrl: string;

  @Column({ nullable: true })
  modelName: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'enum', enum: ModelType, default: ModelType.TEXT })
  type: ModelType;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
