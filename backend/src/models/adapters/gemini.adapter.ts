import { ModelAdapter, TextGenerationResult, ImageGenerationResult } from '../interfaces';

export class GeminiAdapter implements ModelAdapter {
  id: string;
  name: string;
  provider: string;
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private textModel = 'gemini-2.0-flash-exp';
  private imageModel = 'gemini-2.0-flash-exp-image-generation';

  constructor(id: string, name: string, apiKey: string, modelName?: string) {
    this.id = id;
    this.name = name;
    this.provider = 'gemini';
    this.apiKey = apiKey;
    if (modelName) {
      this.textModel = modelName;
    }
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<TextGenerationResult> {
    const url = `${this.baseUrl}/${this.textModel}:generateContent?key=${this.apiKey}`;
    
    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    if (context?.systemPrompt) {
      payload.systemInstruction = { parts: [{ text: context.systemPrompt }] };
    }

    if (context?.schema) {
      payload.generationConfig.responseSchema = context.schema;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return { text };
  }

  async generateImage(prompt: string, options?: Record<string, any>): Promise<ImageGenerationResult> {
    const url = `${this.baseUrl}/${this.imageModel}:generateContent?key=${this.apiKey}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64) {
      throw new Error('No image returned from Gemini');
    }

    return {
      imageUrl: `data:image/png;base64,${base64}`,
      base64,
    };
  }

  async modifyImage(imageUrl: string, instruction: string): Promise<ImageGenerationResult> {
    return this.generateImage(`${instruction}\n\nOriginal image: ${imageUrl}`);
  }
}
