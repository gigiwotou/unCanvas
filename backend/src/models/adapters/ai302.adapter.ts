import { ModelAdapter, TextGenerationResult, ImageGenerationResult } from '../interfaces';

export class Ai302Adapter implements ModelAdapter {
  id: string;
  name: string;
  provider: string;
  private apiKey: string;
  private baseUrl = 'https://api.302.ai/v1';
  private modelName: string;

  constructor(id: string, name: string, apiKey: string, modelName: string) {
    this.id = id;
    this.name = name;
    this.provider = 'ai302';
    this.apiKey = apiKey;
    this.modelName = modelName || 'gpt-4o';
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<TextGenerationResult> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const messages: any[] = [];
    if (context?.systemPrompt) {
      messages.push({ role: 'system', content: context.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload: any = {
      model: this.modelName,
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
      throw new Error(`302.ai API error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    return { text, tokens: data.usage?.total_tokens };
  }

  async generateImage(prompt: string, options?: Record<string, any>): Promise<ImageGenerationResult> {
    const url = `${this.baseUrl}/images/generations`;
    
    const payload = {
      model: this.modelName,
      prompt,
      n: 1,
      size: options?.size || '1024x1024',
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
      throw new Error(`302.ai API error: ${error}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image returned from 302.ai');
    }

    return { imageUrl };
  }

  async modifyImage(imageUrl: string, instruction: string): Promise<ImageGenerationResult> {
    return this.generateImage(`${instruction}\n\nOriginal image: ${imageUrl}`);
  }
}
