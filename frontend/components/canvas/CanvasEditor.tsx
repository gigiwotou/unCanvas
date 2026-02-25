'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiZoomIn, FiZoomOut, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import InfiniteCanvas from './InfiniteCanvas';
import CardActions from './CardActions';
import { useAuthStore, useCanvasStore, useUIStore } from '@/store';
import { canvasApi, modelsApi } from '@/lib/api';
import { Storyboard, Card, ModelConfig } from '@/types';

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function CanvasEditor() {
  const router = useRouter();
  const params = useParams();
  const canvasId = params.id as string;

  const { user } = useAuthStore();
  const { canvas, storyboards, setCanvas, setStoryboards, updateStoryboard, updateCard, addStoryboard, removeStoryboard } = useCanvasStore();
  const { viewport, setViewport, isGenerating, setIsGenerating } = useUIStore();
  
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [textModelId, setTextModelId] = useState<string>('');
  const [imageModelId, setImageModelId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [scale, setScale] = useState(1);
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [userRole, setUserRole] = useState<string>('viewer');

  const canEdit = userRole === 'owner' || userRole === 'admin' || userRole === 'editor';

  const aspectRatioOptions = [
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '4:3', label: '4:3' },
    { value: '3:2', label: '3:2' },
    { value: '9:16', label: '9:16' },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadCanvas();
    loadModelConfigs();
  }, [user, canvasId]);

  const loadCanvas = async () => {
    try {
      const { data } = await canvasApi.getFullData(canvasId);
      setCanvas(data.canvas);
      setStoryboards(data.storyboards);
      setUserRole(data.userRole || 'viewer');
    } catch (err) {
      console.error('Failed to load canvas:', err);
      router.push('/dashboard');
    }
  };

  const loadModelConfigs = async () => {
    try {
      const { data } = await modelsApi.findAllConfigs();
      setModelConfigs(data);
      const textModels = data.filter((m: ModelConfig) => m.enabled && m.type === 'text');
      const imageModels = data.filter((m: ModelConfig) => m.enabled && m.type === 'image');
      if (textModels.length > 0) {
        setTextModelId(textModels[0].id);
      }
      if (imageModels.length > 0) {
        setImageModelId(imageModels[0].id);
      }
    } catch (err) {
      console.error('Failed to load model configs:', err);
    }
  };

  const handleZoomIn = () => {
    setScale(s => Math.min(s + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(s => Math.max(s - 0.1, 0.3));
  };

  const handleResetView = () => {
    setScale(1);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !textModelId) return;

    setIsGenerating(true);
    try {
      const { data } = await modelsApi.generateStoryboard({
        prompt,
        modelConfigId: textModelId,
        characterImage: characterImage || undefined,
        sceneImage: sceneImage || undefined,
      });

      await createStoryboardsFromResult(data);
      setPrompt('');
    } catch (err) {
      console.error('Failed to generate storyboard:', err);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const createStoryboardsFromResult = async (result: any) => {
    const CARD_WIDTH = 288;
    const CARD_GAP = 20;
    const PADDING = 20;
    const CARDS_PER_ROW = 8;
    const CARD_HEIGHT_WITH_GAP = 420;
    const LEFT_PANEL_WIDTH = 320;

    const shotPanelWidth = PADDING * 2 + (CARDS_PER_ROW * (CARD_WIDTH + CARD_GAP)) - CARD_GAP;
    const containerWidth = LEFT_PANEL_WIDTH + shotPanelWidth;

    let initialX = 100;
    let initialY = 100;
    if (storyboards.length > 0) {
      const lastStoryboard = storyboards[storyboards.length - 1];
      initialX = lastStoryboard.x + lastStoryboard.width + 100;
      initialY = lastStoryboard.y;
    }

    const { data: storyboard } = await canvasApi.createStoryboard({
      canvasId,
      title: prompt,
      x: initialX,
      y: initialY,
      width: containerWidth,
      scriptText: result.scriptText,
      characterReferenceImage: characterImage || undefined,
      sceneReferenceImage: sceneImage || undefined,
    });

    const cardsToCreate = [];
    for (let i = 0; i < result.shots.length; i++) {
      const shot = result.shots[i];
      const rowIndex = Math.floor(i / CARDS_PER_ROW);
      const colIndex = i % CARDS_PER_ROW;

      const { data: card } = await canvasApi.createCard({
        storyboardId: storyboard.id,
        type: 'image',
        x: PADDING + (colIndex * (CARD_WIDTH + CARD_GAP)),
        y: PADDING + (rowIndex * CARD_HEIGHT_WITH_GAP),
        title: shot.title,
        description: shot.prompt,
        cameraMovement: shot.cameraMovement,
      });
      cardsToCreate.push(card);
    }

    const rowIndex = Math.floor((result.shots.length) / CARDS_PER_ROW);
    const colIndex = (result.shots.length) % CARDS_PER_ROW;
    const playerX = PADDING + (colIndex * (CARD_WIDTH + CARD_GAP));
    const playerY = PADDING + (rowIndex * CARD_HEIGHT_WITH_GAP);

    const { data: playerCard } = await canvasApi.createCard({
      storyboardId: storyboard.id,
      type: 'player',
      x: playerX,
      y: playerY,
    });

    addStoryboard({
      ...storyboard,
      cards: [...cardsToCreate, playerCard],
    });

    for (const card of cardsToCreate) {
      generateCardImage(card.id, card.description, imageModelId, imageAspectRatio);
    }
  };

  const generateCardImage = async (cardId: string, prompt: string, modelId: string, aspectRatio: string = '1:1') => {
    try {
      await canvasApi.updateCard(cardId, { isLoading: true });
      
      const { data } = await modelsApi.generateImage({
        prompt,
        modelConfigId: modelId,
        aspectRatio,
      });
      
      await canvasApi.updateCard(cardId, { imageUrl: data.imageUrl, isLoading: false });
      loadCanvas();
    } catch (err) {
      console.error('Failed to generate image:', err);
      await canvasApi.updateCard(cardId, { isLoading: false });
    }
  };

  const pendingStoryboardUpdates = useRef<Record<string, Partial<Storyboard>>>({});
  const pendingCardUpdates = useRef<Record<string, { cardId: string; updates: Partial<Card> }>>({});

  const saveStoryboardDebounced = useCallback(
    debounce(async (id: string, updates: Partial<Storyboard>) => {
      try {
        await canvasApi.updateStoryboard(id, updates);
      } catch (err) {
        console.error('Failed to update storyboard:', err);
      }
    }, 500),
    []
  );

  const saveCardDebounced = useCallback(
    debounce(async (cardId: string, updates: Partial<Card>) => {
      try {
        await canvasApi.updateCard(cardId, updates);
      } catch (err) {
        console.error('Failed to update card:', err);
      }
    }, 500),
    []
  );

  const handleUpdateStoryboard = (id: string, updates: Partial<Storyboard>) => {
    updateStoryboard(id, updates);
    pendingStoryboardUpdates.current[id] = { ...pendingStoryboardUpdates.current[id], ...updates };
    saveStoryboardDebounced(id, pendingStoryboardUpdates.current[id]);
  };

  const handleUpdateCard = (cardId: string, updates: Partial<Card>) => {
    const storyboard = storyboards.find(sb => sb.cards.some(c => c.id === cardId));
    if (storyboard) {
      updateCard(storyboard.id, cardId, updates);
    }
    pendingCardUpdates.current[cardId] = { cardId, updates: { ...pendingCardUpdates.current[cardId]?.updates, ...updates } };
    saveCardDebounced(cardId, pendingCardUpdates.current[cardId].updates);
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await canvasApi.removeCard(cardId);
      loadCanvas();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleDeleteStoryboard = async (storyboardId: string) => {
    if (!confirm('确定要删除这个故事板吗？')) return;
    try {
      await canvasApi.removeStoryboard(storyboardId);
      loadCanvas();
    } catch (err) {
      console.error('Failed to delete storyboard:', err);
    }
  };

  const handleExecuteStoryboard = async (storyboardId: string) => {
    const storyboard = storyboards.find(sb => sb.id === storyboardId);
    if (!storyboard) return;

    const playerCard = storyboard.cards.find(c => c.type === 'player');
    if (!playerCard) {
      alert('该故事板没有播放器');
      return;
    }

    const playlist: Card[] = [];
    let currentNodeId = playerCard.id;

    while (currentNodeId !== undefined) {
      const incomingConnection = storyboard.connections.find(c => c.to === currentNodeId);
      if (!incomingConnection) break;

      const fromCard = storyboard.cards.find(c => c.id === incomingConnection.from);
      if (fromCard && fromCard.type === 'image' && fromCard.imageUrl) {
        playlist.unshift(fromCard);
      }
      currentNodeId = incomingConnection.from;
    }

    if (playlist.length > 0) {
      const simplePlaylist = playlist.map(c => ({ id: c.id, imageUrl: c.imageUrl }));
      await canvasApi.updateCard(playerCard.id, {
        isReady: true,
        playlist: simplePlaylist,
        thumbnailUrl: playlist[0].imageUrl,
      });
      loadCanvas();
    } else {
      alert('没有可播放的图片，请先连接图片到播放器');
    }
  };

  const handleDownloadStoryboard = async (storyboardId: string) => {
    const storyboard = storyboards.find(sb => sb.id === storyboardId);
    if (!storyboard) return;

    const imageCards = storyboard.cards.filter(c => c.type === 'image' && c.imageUrl);
    if (imageCards.length === 0) {
      alert('没有可下载的图片');
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    if (storyboard.scriptText) {
      zip.file('script.txt', storyboard.scriptText);
    }

    for (let i = 0; i < imageCards.length; i++) {
      const card = imageCards[i];
      if (!card.imageUrl) continue;
      try {
        const response = await fetch(card.imageUrl);
        const blob = await response.blob();
        zip.file(`shot-${i + 1}.png`, blob);

        const promptText = `Title: ${card.title || 'Untitled'}\n\nCamera: ${card.cameraMovement || 'N/A'}\n\nPrompt: ${card.description || 'N/A'}`;
        zip.file(`shot-${i + 1}-prompt.txt`, promptText);
      } catch (err) {
        console.error(`Failed to download shot ${i + 1}:`, err);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    const fileName = (storyboard.title || 'storyboard').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `scene_${fileName}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleConnectCards = async (fromId: string, toId: string, storyboardId: string) => {
    const storyboard = storyboards.find(sb => sb.id === storyboardId);
    if (!storyboard) return;
    
    const filteredConnections = storyboard.connections.filter(
      c => c.from !== fromId && c.to !== toId
    );
    const newConnections = [...filteredConnections, { from: fromId, to: toId }];
    const updates = { connections: newConnections };
    
    updateStoryboard(storyboardId, updates);
    try {
      await canvasApi.updateStoryboard(storyboardId, updates);
    } catch (err) {
      console.error('Failed to connect cards:', err);
    }
  };

  const handleDeleteConnection = async (storyboardId: string, fromId: string, toId: string) => {
    const storyboard = storyboards.find(sb => sb.id === storyboardId);
    if (!storyboard) return;
    
    const newConnections = storyboard.connections.filter(
      c => !(c.from === fromId && c.to === toId)
    );
    const updates = { connections: newConnections };
    
    updateStoryboard(storyboardId, updates);
    try {
      await canvasApi.updateStoryboard(storyboardId, updates);
    } catch (err) {
      console.error('Failed to delete connection:', err);
    }
  };

  const handleCardModify = async (cardId: string, instruction: string) => {
    const card = storyboards.flatMap(sb => sb.cards).find(c => c.id === cardId);
    if (!card || !imageModelId) return;

    const storyboard = storyboards.find(sb => sb.id === card.storyboardId);
    if (!storyboard) return;

    try {
      const { data: newCard } = await canvasApi.createCard({
        storyboardId: storyboard.id,
        type: 'image',
        x: card.x,
        y: card.y + 350,
        title: `修改于: ${card.title}`,
        description: `${card.description}\n(修改指令: ${instruction})`,
        cameraMovement: card.cameraMovement,
        aspectRatio: card.aspectRatio || '16:9',
        isLoading: true,
      });

      loadCanvas();

      const { data } = await modelsApi.modifyImage({
        imageUrl: card.imageUrl || '',
        instruction,
        modelConfigId: imageModelId,
      });

      await canvasApi.updateCard(newCard.id, { imageUrl: data.imageUrl, isLoading: false });
      loadCanvas();
    } catch (err) {
      console.error('Failed to modify image:', err);
    }
  };

  const handleCardRetry = async (cardId: string, newPrompt: string) => {
    await handleUpdateCard(cardId, { isLoading: true, description: newPrompt });
    await generateCardImage(cardId, newPrompt, imageModelId, imageAspectRatio);
  };

  const handleCardSimilar = async (cardId: string) => {
    const card = storyboards.flatMap(sb => sb.cards).find(c => c.id === cardId);
    if (!card || !imageModelId) return;

    const { data: newCard } = await canvasApi.createCard({
      storyboardId: card.storyboardId,
      type: 'image',
      x: card.x,
      y: card.y + 350,
      title: `相似: ${card.title}`,
      description: card.description,
      cameraMovement: card.cameraMovement,
      isLoading: true,
    });

    loadCanvas();

    try {
      await generateCardImage(newCard.id, card.description || '', imageModelId, imageAspectRatio);
      loadCanvas();
    } catch (err) {
      console.error('Failed to generate similar image:', err);
    }
  };

  const handleCardPlay = async (cardId: string) => {
    const storyboard = storyboards.find(sb => sb.cards.some(c => c.id === cardId));
    if (!storyboard) return;

    const playerCard = storyboard.cards.find(c => c.type === 'player');
    if (!playerCard) return;

    const playlist = [];
    let currentId = cardId;

    while (currentId) {
      const conn = storyboard.connections.find(c => c.to === currentId);
      if (!conn) break;
      
      const fromCard = storyboard.cards.find(c => c.id === conn.from);
      if (fromCard && fromCard.type === 'image' && fromCard.imageUrl) {
        playlist.unshift({ id: fromCard.id, imageUrl: fromCard.imageUrl });
      }
      currentId = conn.from;
    }

    await handleUpdateCard(playerCard.id, {
      isReady: true,
      playlist,
      thumbnailUrl: playlist[0]?.imageUrl,
      isPlaying: true,
      currentFrame: 0,
    });
    loadCanvas();
  };

  const handleCardStop = async (cardId: string) => {
    await handleUpdateCard(cardId, { isPlaying: false, currentFrame: 0 });
    loadCanvas();
  };

  const characterFileRef = useRef<HTMLInputElement>(null);
  const sceneFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'character' | 'scene') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'character') {
        setCharacterImage(event.target?.result as string);
      } else {
        setSceneImage(event.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearRefImage = (type: 'character' | 'scene') => {
    if (type === 'character') {
      setCharacterImage(null);
      if (characterFileRef.current) {
        characterFileRef.current.value = '';
      }
    } else {
      setSceneImage(null);
      if (sceneFileRef.current) {
        sceneFileRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition flex items-center"
          >
            <FiArrowLeft className="mr-1" /> 返回
          </button>
          <h1 className="font-semibold">{canvas?.title || '无限画布'}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-xs">文本:</span>
          <button
            onClick={() => setShowModelSelect(!showModelSelect)}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm transition"
          >
            {modelConfigs.find(m => m.id === textModelId)?.name || '选择模型'}
          </button>
          <span className="text-gray-400 text-xs">图像:</span>
          <button
            onClick={() => setShowModelSelect(!showModelSelect)}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm transition"
          >
            {modelConfigs.find(m => m.id === imageModelId)?.name || '选择模型'}
          </button>
        </div>
      </header>

      {showModelSelect && (
        <div className="fixed top-12 right-4 z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-2 w-64">
          <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700">文本模型</div>
          {modelConfigs.filter(m => m.type === 'text').map(config => (
            <button
              key={config.id}
              onClick={() => {
                setTextModelId(config.id);
                setShowModelSelect(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                config.id === textModelId ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              {config.name}
            </button>
          ))}
          {modelConfigs.filter(m => m.type === 'text').length === 0 && (
            <p className="px-4 py-2 text-gray-500 text-sm">暂无可用文本模型</p>
          )}
          <div className="text-xs text-gray-400 px-2 py-1 border-t border-gray-700 mt-2">图像模型</div>
          {modelConfigs.filter(m => m.type === 'image').map(config => (
            <button
              key={config.id}
              onClick={() => {
                setImageModelId(config.id);
                setShowModelSelect(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                config.id === imageModelId ? 'bg-green-600' : 'hover:bg-gray-700'
              }`}
            >
              {config.name}
            </button>
          ))}
          {modelConfigs.filter(m => m.type === 'image').length === 0 && (
            <p className="px-4 py-2 text-gray-500 text-sm">暂无可用图像模型</p>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
        <div className="bg-gray-900/70 backdrop-blur-lg rounded-full shadow-2xl flex items-center h-16 border border-gray-700 overflow-hidden">
          <div className="h-full w-24 flex-shrink-0 flex items-center justify-center relative">
            <label className="absolute inset-0 flex items-center justify-center text-gray-400 hover:bg-white/10 transition cursor-pointer">
              <input
                ref={characterFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'character')}
              />
              <div className="flex items-center space-x-2 z-10">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                </svg>
                <span className="text-xs">角色</span>
              </div>
            </label>
            {characterImage && (
              <>
                <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${characterImage})` }} />
                <button
                  onClick={() => clearRefImage('character')}
                  className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs z-20"
                >
                  ×
                </button>
              </>
            )}
          </div>

          <div className="w-px h-8 bg-gray-600" />

          <div className="h-full w-24 flex-shrink-0 flex items-center justify-center relative">
            <label className="absolute inset-0 flex items-center justify-center text-gray-400 hover:bg-white/10 transition cursor-pointer">
              <input
                ref={sceneFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'scene')}
              />
              <div className="flex items-center space-x-2 z-10">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                  <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z"/>
                </svg>
                <span className="text-xs">场景</span>
              </div>
            </label>
            {sceneImage && (
              <>
                <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${sceneImage})` }} />
                <button
                  onClick={() => clearRefImage('scene')}
                  className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs z-20"
                >
                  ×
                </button>
              </>
            )}
          </div>

          <div className="w-px h-8 bg-gray-600" />

          <select
            value={imageAspectRatio}
            onChange={(e) => setImageAspectRatio(e.target.value)}
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded-lg focus:outline-none"
          >
            {aspectRatioOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <div className="w-px h-8 bg-gray-600" />

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入剧本主题，例如'一个侦探故事，分6个镜头'"
            disabled={!canEdit}
            className="bg-transparent text-white placeholder-gray-400 text-base px-4 h-full flex-1 focus:outline-none disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && canEdit && handleGenerate()}
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || !textModelId || !canEdit}
            className={`font-bold h-full px-6 flex-shrink-0 flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed ${
              textModelId 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>思考中...</span>
              </>
            ) : (
              <span>{textModelId ? '生成' : '请先配置文本模型'}</span>
            )}
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-30">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-xl hover:bg-gray-700 transition"
        >
          <FiZoomIn />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-xl hover:bg-gray-700 transition"
        >
          <FiZoomOut />
        </button>
        <button
          onClick={handleResetView}
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:bg-gray-700 transition"
        >
          <FiRefreshCw />
        </button>
      </div>

      <div 
        className="absolute top-14 left-0 right-0 bottom-0 overflow-hidden"
      >
        <InfiniteCanvas
          storyboards={storyboards}
          onUpdateStoryboard={handleUpdateStoryboard}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onConnectCards={handleConnectCards}
          onDeleteConnection={handleDeleteConnection}
          onExecuteStoryboard={handleExecuteStoryboard}
          onDownloadStoryboard={handleDownloadStoryboard}
          onPlay={handleCardPlay}
          onStop={handleCardStop}
          onModifyCard={handleCardModify}
          onRetryCard={handleCardRetry}
          onSimilarCard={handleCardSimilar}
          canEdit={canEdit}
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onSelectCard={setSelectedCard}
          onSelectStoryboard={() => {}}
          onDeleteStoryboard={handleDeleteStoryboard}
        />
      </div>

      {selectedCard && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <CardActions
            card={selectedCard}
            onModify={handleCardModify}
            onRetry={handleCardRetry}
            onSimilar={handleCardSimilar}
            onDelete={handleDeleteCard}
            onPlay={handleCardPlay}
            onStop={handleCardStop}
            canEdit={canEdit}
          />
        </div>
      )}
    </div>
  );
}
