export interface TextGenerationResult {
  text: string;
  tokens?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
  base64?: string;
}

export interface ModelAdapter {
  id: string;
  name: string;
  provider: string;
  generateText(prompt: string, context?: Record<string, any>): Promise<TextGenerationResult>;
  generateImage(prompt: string, options?: Record<string, any>): Promise<ImageGenerationResult>;
  modifyImage(imageUrl: string, instruction: string): Promise<ImageGenerationResult>;
}

export interface StoryboardGenerationResult {
  scriptText: string;
  shots: Array<{
    title: string;
    cameraMovement: string;
    prompt: string;
  }>;
}
