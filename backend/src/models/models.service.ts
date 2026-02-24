import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelConfig, ModelProvider } from './model-config.entity';
import { ModelAdapter, StoryboardGenerationResult } from './interfaces';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { UploadService } from '../common/upload.service';

@Injectable()
export class ModelsService {
  private adapters: Map<string, ModelAdapter> = new Map();

  constructor(
    @InjectRepository(ModelConfig)
    private configRepository: Repository<ModelConfig>,
    private uploadService: UploadService,
  ) {}

  async createConfig(config: Partial<ModelConfig>): Promise<ModelConfig> {
    const entity = this.configRepository.create(config);
    return this.configRepository.save(entity);
  }

  async findAllConfigs(): Promise<ModelConfig[]> {
    return this.configRepository.find({ where: { enabled: true } });
  }

  async findConfig(id: string): Promise<ModelConfig> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('模型配置不存在');
    }
    return config;
  }

  async updateConfig(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
    const config = await this.findConfig(id);
    Object.assign(config, updates);
    return this.configRepository.save(config);
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.findConfig(id);
    this.adapters.delete(id);
    await this.configRepository.remove(config);
  }

  getAdapter(configId: string): ModelAdapter {
    const adapter = this.adapters.get(configId);
    if (!adapter) {
      throw new NotFoundException('模型适配器未初始化');
    }
    return adapter;
  }

  async initializeAdapter(config: ModelConfig): Promise<ModelAdapter> {
    let adapter: ModelAdapter;

    switch (config.provider) {
      case ModelProvider.GEMINI:
        adapter = new GeminiAdapter(config.id, config.name, config.apiKey, config.modelName);
        break;
      case ModelProvider.OPENAI:
        adapter = new OpenAIAdapter(config.id, config.name, config.apiKey, config.apiUrl, config.modelName);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    this.adapters.set(config.id, adapter);
    return adapter;
  }

  async generateStoryboard(prompt: string, configId: string, characterImage?: string, sceneImage?: string): Promise<StoryboardGenerationResult> {
    const adapter = this.getAdapter(configId);
    
    const systemPrompt = `You are a world-class film director's assistant. Your task is to interpret a user's script idea, break it down into a series of distinct storyboard shots, and then weave those shots into a cohesive script.
    - Analyze the user's prompt to determine the number of shots.
    - For each shot, generate: 1. A concise, descriptive title. 2. A string describing the camera movement (e.g., "Wide Shot, Pan Right", "Close-up, Dolly Zoom"). 3. A detailed prompt for image generation.
    - After defining all shots, write a cohesive, narrative script in a single block of text that combines all the shot descriptions.
    - You MUST return a single JSON object with two keys: "scriptText" (the full narrative script as a string) and "shots" (an array of objects, where each object has "title", "cameraMovement", and "prompt" keys).`;

    const schema = {
      type: 'OBJECT',
      properties: {
        scriptText: { type: 'STRING' },
        shots: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              cameraMovement: { type: 'STRING' },
              prompt: { type: 'STRING' },
            },
            required: ['title', 'cameraMovement', 'prompt'],
          },
        },
      },
      required: ['scriptText', 'shots'],
    };

    const result = await adapter.generateText(prompt, {
      systemPrompt,
      schema,
    });

    try {
      return JSON.parse(result.text);
    } catch (e) {
      throw new Error('Failed to parse storyboard response');
    }
  }

  async generateImage(prompt: string, configId: string): Promise<string> {
    const adapter = this.getAdapter(configId);
    const result = await adapter.generateImage(prompt);
    
    if (result.imageUrl.startsWith('data:')) {
      const uploadResult = await this.uploadService.uploadBase64Image(result.imageUrl, 'generated');
      return uploadResult.url;
    }
    
    return result.imageUrl;
  }

  async modifyImage(imageUrl: string, instruction: string, configId: string): Promise<string> {
    const adapter = this.getAdapter(configId);
    const result = await adapter.modifyImage(imageUrl, instruction);
    
    if (result.imageUrl.startsWith('data:')) {
      const uploadResult = await this.uploadService.uploadBase64Image(result.imageUrl, 'generated');
      return uploadResult.url;
    }
    
    return result.imageUrl;
  }
}
