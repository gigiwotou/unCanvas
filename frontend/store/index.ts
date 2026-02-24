import { create } from 'zustand';
import { User, Workspace, Canvas, Storyboard, Card } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));

interface CanvasState {
  canvas: Canvas | null;
  storyboards: Storyboard[];
  setCanvas: (canvas: Canvas | null) => void;
  setStoryboards: (storyboards: Storyboard[]) => void;
  updateStoryboard: (id: string, updates: Partial<Storyboard>) => void;
  addStoryboard: (storyboard: Storyboard) => void;
  removeStoryboard: (id: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  canvas: null,
  storyboards: [],
  setCanvas: (canvas) => set({ canvas }),
  setStoryboards: (storyboards) => set({ storyboards }),
  updateStoryboard: (id, updates) =>
    set((state) => ({
      storyboards: state.storyboards.map((sb) =>
        sb.id === id ? { ...sb, ...updates } : sb
      ),
    })),
  addStoryboard: (storyboard) =>
    set((state) => ({
      storyboards: [...state.storyboards, storyboard],
    })),
  removeStoryboard: (id) =>
    set((state) => ({
      storyboards: state.storyboards.filter((sb) => sb.id !== id),
    })),
}));

interface UIState {
  viewport: { x: number; y: number; zoom: number };
  selectedCardId: string | null;
  isGenerating: boolean;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setSelectedCardId: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedCardId: null,
  isGenerating: false,
  setViewport: (viewport) => set({ viewport }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
