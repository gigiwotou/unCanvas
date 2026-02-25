import { ModelAdapter, TextGenerationResult, ImageGenerationResult } from '../interfaces';

export class Ai302Adapter implements ModelAdapter {
  id: string;
  name: string;
  provider: string;
  private apiKey: string;
  private baseUrl = 'https://api.302.ai';
  private modelName: string;
  private useGoogle = false;

  constructor(id: string, name: string, apiKey: string, modelName: string) {
    this.id = id;
    this.name = name;
    this.provider = 'ai302';
    this.apiKey = apiKey;
    this.modelName = modelName || 'gpt-4o';
    if (modelName?.includes('gemini')) {
      this.useGoogle = true;
    }
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<TextGenerationResult> {
    if (this.useGoogle) {
      return this.generateGoogleText(prompt, context);
    }
    
    const url = `${this.baseUrl}/v1/chat/completions`;
    
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

  private async generateGoogleText(prompt: string, context?: Record<string, any>): Promise<TextGenerationResult> {
    const url = `${this.baseUrl}/google/v1/models/${this.modelName}`;
    
    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (context?.systemPrompt) {
      payload.systemInstruction = { parts: [{ text: context.systemPrompt }] };
    }

    if (context?.schema) {
      payload.generationConfig = {
        responseMimeType: 'application/json',
        responseSchema: context.schema,
      };
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
      throw new Error(`302.ai Google API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return { text, tokens: 0 };
  }

  async generateImage(prompt: string, options?: Record<string, any>): Promise<ImageGenerationResult> {
    if (this.useGoogle) {
      return this.generateGoogleImage(prompt, options);
    }
    
    const url = `${this.baseUrl}/v1/images/generations`;
    
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

  private async generateGoogleImage(prompt: string, options?: Record<string, any>): Promise<ImageGenerationResult> {
    const url = `${this.baseUrl}/google/v1/models/${this.modelName}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: options?.aspectRatio || '16:9',
        },
      },
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
      throw new Error(`302.ai Google Image API error: ${error}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    
    if (!parts || !Array.isArray(parts)) {
      throw new Error('No image returned from 302.ai Google API');
    }
    
    let imageUrl = '';
    
    const urlPart = parts.find((p: any) => p.url);
    if (urlPart?.url) {
      imageUrl = urlPart.url;
    }
    
    const inlinePart = parts.find((p: any) => p.inlineData?.data);
    if (inlinePart?.inlineData?.data) {
      imageUrl = `data:${inlinePart.inlineData.mimeType};base64,${inlinePart.inlineData.data}`;
    }

    if (!imageUrl) {
      throw new Error('No image returned from 302.ai Google API');
    }

    return { imageUrl };
  }

  async modifyImage(imageUrl: string, instruction: string): Promise<ImageGenerationResult> {
    if (this.useGoogle) {
      return this.generateGoogleImage(`${instruction}\n\nOriginal image: ${imageUrl}`);
    }
    return this.generateImage(`${instruction}\n\nOriginal image: ${imageUrl}`);
  }
}
