export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  user: User;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface Canvas {
  id: string;
  title: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
  viewport?: { x: number; y: number; zoom: number };
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Storyboard {
  id: string;
  canvasId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scriptText?: string;
  characterReferenceImage?: string;
  sceneReferenceImage?: string;
  connections: Array<{ from: string; to: string }>;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  storyboardId: string;
  type: 'image' | 'player';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  description?: string;
  cameraMovement?: string;
  imageUrl?: string;
  isLoading: boolean;
  isReady: boolean;
  isPlaying: boolean;
  playlist?: Array<{ id: string; imageUrl: string }>;
  thumbnailUrl?: string;
  currentFrame: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'vertex' | 'ai302';
  apiKey: string;
  apiUrl?: string;
  modelName?: string;
  enabled: boolean;
  type: 'text' | 'image';
}

export interface StoryboardGenerationResult {
  scriptText: string;
  shots: Array<{
    title: string;
    cameraMovement: string;
    prompt: string;
  }>;
}
