import { ModelAdapter, TextGenerationResult, ImageGenerationResult } from '../interfaces';

export class OpenAIAdapter implements ModelAdapter {
  id: string;
  name: string;
  provider: string;
  private apiKey: string;
  private baseUrl: string;
  private textModel: string;
  private imageModel: string;

  constructor(id: string, name: string, apiKey: string, baseUrl?: string, modelName?: string) {
    this.id = id;
    this.name = name;
    this.provider = 'openai';
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.textModel = modelName || 'gpt-4o';
    this.imageModel = 'dall-e-3';
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<TextGenerationResult> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const messages: any[] = [];
    if (context?.systemPrompt) {
      messages.push({ role: 'system', content: context.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload: any = {
      model: this.textModel,
      messages,
      temperature: context?.temperature || 0.7,
    };

    if (context?.schema) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    return { text, tokens: data.usage?.total_tokens };
  }

  async generateImage(prompt: string, options?: Record<string, any>): Promise<ImageGenerationResult> {
    const url = `${this.baseUrl}/images/generations`;
    
    const payload = {
      model: this.imageModel,
      prompt,
      n: 1,
      size: options?.size || '1024x1024',
      quality: options?.quality || 'standard',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image returned from OpenAI');
    }

    return { imageUrl };
  }

  async modifyImage(imageUrl: string, instruction: string): Promise<ImageGenerationResult> {
    return this.generateImage(`${instruction}\n\nOriginal image: ${imageUrl}`, { size: '1024x1024' });
  }
}
