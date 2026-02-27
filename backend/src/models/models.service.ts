import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelConfig, ModelProvider } from './model-config.entity';
import { ModelAdapter, StoryboardGenerationResult } from './interfaces';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { Ai302Adapter } from './adapters/ai302.adapter';
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
    return this.configRepository.find();
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
      case ModelProvider.AI302:
        adapter = new Ai302Adapter(config.id, config.name, config.apiKey, config.modelName);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    this.adapters.set(config.id, adapter);
    return adapter;
  }

  async generateStoryboard(prompt: string, configId: string, characterImage?: string, sceneImage?: string): Promise<StoryboardGenerationResult & { characterImageUrl?: string; sceneImageUrl?: string }> {
    const adapter = this.getAdapter(configId);
    
    let characterImageUrl = characterImage;
    let sceneImageUrl = sceneImage;

    if (characterImage?.startsWith('data:')) {
      const uploadResult = await this.uploadService.uploadBase64Image(characterImage, 'character');
      characterImageUrl = uploadResult.url;
    }

    if (sceneImage?.startsWith('data:')) {
      const uploadResult = await this.uploadService.uploadBase64Image(sceneImage, 'scene');
      sceneImageUrl = uploadResult.url;
    }

    const isChinese = /^[\u4e00-\u9fa5]/.test(prompt);
    const systemPrompt = isChinese
      ? `你是一位世界级的电影导演助手。你的任务是将用户的剧本创意分解为一系列独特的分镜画面，并将这些画面编织成一个连贯的剧本。
- 分析用户的提示以确定分镜数量。
- 每个分镜需要生成：1. 一个简洁的描述性标题。2. 描述镜头运动（如"全景镜头，右摇"、"特写，推拉变焦"）。3. 用于图像生成的详细描述。
- 在定义所有分镜后，写一段连贯的叙事剧本，将所有分镜描述结合在一起。
- 你必须返回一个包含两个键的JSON对象："scriptText"（完整的叙事剧本字符串）和"shots"（数组，每个对象包含"title"、"cameraMovement"和"prompt"键）。`
      : `You are a world-class film director's assistant. Your task is to interpret a user's script idea, break it down into a series of distinct storyboard shots, and then weave those shots into a cohesive script.
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
      const storyboard = JSON.parse(result.text);
      return {
        ...storyboard,
        characterImageUrl,
        sceneImageUrl,
      };
    } catch (e) {
      throw new Error('Failed to parse storyboard response');
    }
  }

  async generateImage(prompt: string, configId: string, aspectRatio?: string): Promise<string> {
    const adapter = this.getAdapter(configId);
    const result = await adapter.generateImage(prompt, { aspectRatio: aspectRatio || '1:1' });
    
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
