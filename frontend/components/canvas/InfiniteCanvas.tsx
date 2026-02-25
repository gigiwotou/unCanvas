'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Storyboard, Card } from '@/types';
import { FiTrash2 } from 'react-icons/fi';
import CardActions from './CardActions';

interface InfiniteCanvasProps {
  storyboards: Storyboard[];
  onUpdateStoryboard: (id: string, updates: Partial<Storyboard>) => void;
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteCard: (cardId: string) => void;
  onConnectCards: (fromId: string, toId: string, storyboardId: string) => void;
  onDeleteConnection: (storyboardId: string, fromId: string, toId: string) => void;
  onModifyCard?: (cardId: string, instruction: string) => void;
  onRetryCard?: (cardId: string, newPrompt: string) => void;
  onSimilarCard?: (cardId: string) => void;
  scale?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSelectCard?: (card: Card | null) => void;
  onSelectStoryboard?: (storyboard: Storyboard | null) => void;
  onDeleteStoryboard?: (storyboardId: string) => void;
}

const HEADER_HEIGHT = 60;
const LEFT_PANEL_WIDTH = 320;
const CARD_WIDTH = 288;
const CARD_HEIGHT = 200;
const CARD_GAP = 20;
const PADDING = 20;
const CARDS_PER_ROW = 8;

export default function InfiniteCanvas({
  storyboards,
  onUpdateStoryboard,
  onUpdateCard,
  onDeleteCard,
  onConnectCards,
  onDeleteConnection,
  onModifyCard,
  onRetryCard,
  onSimilarCard,
  scale = 1,
  onZoomIn,
  onZoomOut,
  onSelectCard,
  onSelectStoryboard,
  onDeleteStoryboard,
}: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingStoryboard, setDraggingStoryboard] = useState<string | null>(null);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ from: string; storyboardId: string } | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [resizingStoryboard, setResizingStoryboard] = useState<string | null>(null);
  const [collapsedScripts, setCollapsedScripts] = useState<Record<string, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const handleStoryboardMouseDown = (e: React.MouseEvent, storyboard: Storyboard) => {
    if (!(e.target as HTMLElement).closest('.no-drag')) return;
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    e.stopPropagation();
    const mouseCanvasX = (e.clientX / scale) - canvasOffset.x;
    const mouseCanvasY = (e.clientY / scale) - canvasOffset.y;
    setDraggingStoryboard(storyboard.id);
    setDragOffset({
      x: mouseCanvasX - storyboard.x,
      y: mouseCanvasY - storyboard.y,
    });
  };

  const handleCardMouseDown = (e: React.MouseEvent, card: Card, storyboardId: string) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    e.stopPropagation();
    const mouseCanvasX = (e.clientX / scale) - canvasOffset.x;
    const mouseCanvasY = (e.clientY / scale) - canvasOffset.y;
    setDraggingCard(card.id);
    setDragOffset({
      x: mouseCanvasX - card.x,
      y: mouseCanvasY - card.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x) / scale;
      const dy = (e.clientY - panStart.y) / scale;
      setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    if (draggingStoryboard) {
      const mouseCanvasX = (e.clientX / scale) - canvasOffset.x;
      const mouseCanvasY = (e.clientY / scale) - canvasOffset.y;
      const newX = mouseCanvasX - dragOffset.x;
      const newY = mouseCanvasY - dragOffset.y;
      onUpdateStoryboard(draggingStoryboard, { x: newX, y: newY });
    }
    if (draggingCard) {
      const storyboard = storyboards.find(sb => sb.cards.some(c => c.id === draggingCard));
      if (!storyboard) return;
      const storyboardEl = document.getElementById(`storyboard-${storyboard.id}`);
      const shotPanel = storyboardEl?.querySelector('.storyboard-shot-panel') as HTMLElement;
      const panelRect = shotPanel?.getBoundingClientRect();
      
      const mouseCanvasX = (e.clientX / scale) - canvasOffset.x;
      const mouseCanvasY = (e.clientY / scale) - canvasOffset.y;
      let newX = mouseCanvasX - dragOffset.x;
      let newY = mouseCanvasY - dragOffset.y;
      
      const minX = PADDING;
      const minY = PADDING;
      const maxX = panelRect ? (panelRect.width / scale) - CARD_WIDTH - PADDING : storyboard.width - LEFT_PANEL_WIDTH - CARD_WIDTH - PADDING;
      const maxY = panelRect ? (panelRect.height / scale) - CARD_HEIGHT - PADDING : storyboard.height - CARD_HEIGHT - PADDING;
      
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));
      onUpdateCard(draggingCard, { x: newX, y: newY });
    }
    if (resizingStoryboard) {
      const storyboard = storyboards.find(sb => sb.id === resizingStoryboard);
      if (!storyboard) return;
      const mouseCanvasX = (e.clientX / scale) - canvasOffset.x;
      const mouseCanvasY = (e.clientY / scale) - canvasOffset.y;
      const newWidth = Math.max(LEFT_PANEL_WIDTH + 200, mouseCanvasX - storyboard.x);
      const minHeight = getStoryboardHeight(storyboard);
      const newHeight = Math.max(minHeight, mouseCanvasY - storyboard.y);
      onUpdateStoryboard(resizingStoryboard, { width: newWidth, height: newHeight });
    }
    if (connecting) {
      const storyboardEl = document.getElementById(`storyboard-${connecting.storyboardId}`);
      const shotPanel = storyboardEl?.querySelector('.storyboard-shot-panel');
      const rect = shotPanel?.getBoundingClientRect();
      if (rect) {
        setTempConnection({
          x: (e.clientX - rect.left) / scale,
          y: (e.clientY - rect.top) / scale,
        });
      }
    }
  }, [isPanning, panStart, draggingStoryboard, draggingCard, dragOffset, canvasOffset, connecting, storyboards, onUpdateStoryboard, onUpdateCard, scale]);

  const handleMouseUp = useCallback(() => {
    setDraggingStoryboard(null);
    setDraggingCard(null);
    setConnecting(null);
    setTempConnection(null);
    setIsPanning(false);
    setResizingStoryboard(null);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        onZoomIn?.();
      } else {
        onZoomOut?.();
      }
    }
  }, [onZoomIn, onZoomOut]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleContextMenu]);

  const handleConnectorMouseDown = (e: React.MouseEvent, cardId: string, storyboardId: string) => {
    e.stopPropagation();
    
    const storyboard = storyboards.find(sb => sb.id === storyboardId);
    if (storyboard) {
      const existingConnection = storyboard.connections.find(c => c.from === cardId);
      if (existingConnection) {
        onDeleteConnection(storyboardId, cardId, existingConnection.to);
      }
    }
    
    setConnecting({ from: cardId, storyboardId });
    const storyboardEl = document.getElementById(`storyboard-${storyboardId}`);
    const shotPanel = storyboardEl?.querySelector('.storyboard-shot-panel');
    const rect = shotPanel?.getBoundingClientRect();
    if (rect) {
      setTempConnection({
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      });
    }
  };

  const handleConnectorMouseUp = (cardId: string, storyboardId: string) => {
    if (connecting && connecting.from !== cardId) {
      onConnectCards(connecting.from, cardId, storyboardId);
    }
    setConnecting(null);
    setTempConnection(null);
  };

  const getConnectorPosition = (card: Card, type: 'in' | 'out', storyboardId: string) => {
    const CARD_WIDTH = 288;
    const CARD_IMAGE_HEIGHT = 192;
    
    const cardX = card.x + PADDING;
    const cardY = card.y + PADDING;
    
    if (type === 'in') {
      return {
        x: cardX - 8,
        y: cardY + CARD_IMAGE_HEIGHT / 2,
      };
    } else {
      return {
        x: cardX + CARD_WIDTH + 8,
        y: cardY + CARD_IMAGE_HEIGHT / 2,
      };
    }
  };

  const renderConnections = (storyboard: Storyboard) => {
    return storyboard.connections.map((conn, idx) => {
      const fromCard = storyboard.cards.find(c => c.id === conn.from);
      const toCard = storyboard.cards.find(c => c.id === conn.to);
      if (!fromCard || !toCard) return null;

      const start = getConnectorPosition(fromCard, 'out', storyboard.id);
      const end = getConnectorPosition(toCard, 'in', storyboard.id);
      const dx = Math.abs(end.x - start.x);
      
      const path = `M ${start.x} ${start.y} C ${start.x + dx * 0.5} ${start.y}, ${end.x - dx * 0.5} ${end.y}, ${end.x} ${end.y}`;

      return (
        <g key={`conn-${idx}`}>
          <path
            d={path}
            stroke="rgba(167, 139, 250, 0.6)"
            strokeWidth={3 / scale}
            fill="none"
            className="cursor-pointer hover:stroke-pink-500"
            onClick={() => onDeleteConnection(storyboard.id, conn.from, conn.to)}
          />
        </g>
      );
    });
  };

  const renderTempConnection = (storyboard: Storyboard) => {
    if (!connecting || !tempConnection || connecting.storyboardId !== storyboard.id) return null;
    
    const fromCard = storyboard.cards.find(c => c.id === connecting.from);
    if (!fromCard) return null;

    const start = getConnectorPosition(fromCard, 'out', storyboard.id);
    const dx = Math.abs(tempConnection.x - start.x);
    const path = `M ${start.x} ${start.y} C ${start.x + dx * 0.5} ${start.y}, ${tempConnection.x - dx * 0.5} ${tempConnection.y}, ${tempConnection.x} ${tempConnection.y}`;

    return (
      <path
        d={path}
        stroke="rgba(167, 139, 250, 0.3)"
        strokeWidth={2}
        strokeDasharray="5,5"
        fill="none"
      />
    );
  };

  const getStoryboardHeight = (storyboard: Storyboard) => {
    const maxCardsPerRow = Math.max(...storyboard.cards.map((_, i) => i + 1), 1);
    const rows = Math.ceil(maxCardsPerRow / CARDS_PER_ROW);
    const minContentHeight = PADDING * 2 + rows * (CARD_HEIGHT + CARD_GAP);
    return HEADER_HEIGHT + 80 + minContentHeight;
  };

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 w-full h-full dot-pattern overflow-hidden"
    >
      <div style={{ 
        transform: `scale(${scale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`, 
        transformOrigin: 'top left', 
        width: '100%', 
        height: '100%',
        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
      }}>

        {storyboards.map(storyboard => {
          const minHeight = getStoryboardHeight(storyboard);
          return (
          <div
            key={storyboard.id}
            className="absolute bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col select-none overflow-hidden border border-gray-700/50"
            id={`storyboard-${storyboard.id}`}
            style={{
              left: storyboard.x,
              top: storyboard.y,
              width: storyboard.width,
              height: storyboard.height,
              minHeight: minHeight,
            }}
            onMouseDown={(e) => handleStoryboardMouseDown(e, storyboard)}
          >
            <div className="bg-gray-900/70 p-3 flex justify-between items-center flex-shrink-0 cursor-move no-drag">
              <h2 className="font-bold text-white truncate flex-1">{storyboard.title}</h2>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteStoryboard?.(storyboard.id);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm transition"
              >
                ×
              </button>
            </div>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize no-drag"
              style={{ zIndex: 10 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const mouseCanvasX = (e.clientX / scale) - canvasOffset.x;
                const mouseCanvasY = (e.clientY / scale) - canvasOffset.y;
                setDragOffset({ x: mouseCanvasX, y: mouseCanvasY });
                setResizingStoryboard(storyboard.id);
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500 hover:text-gray-300">
                <path fill="currentColor" d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
              </svg>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 p-4 overflow-y-auto bg-gray-900/30 flex-shrink-0 border-r border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-2">主题</h3>
                <p className="text-white mb-4">{storyboard.title}</p>

                {storyboard.characterReferenceImage && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-2">角色参考</h3>
                    <img src={storyboard.characterReferenceImage} alt="角色参考" className="w-full h-auto object-cover rounded-md mb-4" />
                  </>
                )}

                {storyboard.sceneReferenceImage && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 border-b border-gray-700 pb-2">场景参考</h3>
                    <img src={storyboard.sceneReferenceImage} alt="场景参考" className="w-full h-auto object-cover rounded-md mb-4" />
                  </>
                )}

                {storyboard.scriptText && (
                  <>
                    <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                      <h3 className="text-sm font-semibold text-gray-400">剧本</h3>
                      <button
                        onClick={() => setCollapsedScripts(prev => ({ ...prev, [storyboard.id]: !prev[storyboard.id] }))}
                        className="text-gray-500 hover:text-gray-300 text-xs"
                      >
                        {collapsedScripts[storyboard.id] !== false ? '展开' : '折叠'}
                      </button>
                    </div>
                    <div 
                      className={`text-gray-300 text-sm whitespace-pre-wrap transition-all duration-200 ${
                        collapsedScripts[storyboard.id] !== false ? 'max-h-24 overflow-y-auto' : ''
                      }`}
                    >
                      {storyboard.scriptText}
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 relative overflow-hidden">
                <div 
                  className="absolute inset-0 overflow-auto storyboard-shot-panel"
                >
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 0 }}
                  >
                    {renderConnections(storyboard)}
                    {renderTempConnection(storyboard)}
                  </svg>
                  {storyboard.cards.map(card => {
                    return (
                    <div
                      key={card.id}
                      id={`card-${card.id}`}
                      className={`absolute bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                        card.type === 'player' ? 'w-[576px]' : 'w-72'
                      }`}
                      style={{ left: card.x + PADDING, top: card.y + PADDING, zIndex: 1 }}
                      onMouseDown={(e) => handleCardMouseDown(e, card, storyboard.id)}
                    >
                      {card.type === 'image' && (
                        <>
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-800 z-10 cursor-crosshair"
                            onMouseUp={() => handleConnectorMouseUp(card.id, storyboard.id)}
                          />
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-800 z-10 cursor-crosshair"
                            onMouseDown={(e) => handleConnectorMouseDown(e, card.id, storyboard.id)}
                          />
                        </>
                      )}
                      
                      {card.type === 'player' && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-800 z-10"
                          onMouseUp={() => handleConnectorMouseUp(card.id, storyboard.id)}
                        />
                      )}

                      <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                        {card.isLoading ? (
                          <div className="w-10 h-10 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                        ) : card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500">未生成</span>
                        )}
                      </div>
                      <div className="p-3 bg-gray-900/50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white truncate text-sm">{card.title}</h4>
                            {card.cameraMovement && (
                              <p className="text-xs text-gray-400 mt-1">{card.cameraMovement}</p>
                            )}
                          </div>
                        </div>
                        {expandedCards[card.id] && card.description && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-400 whitespace-pre-wrap">{card.description}</p>
                          </div>
                        )}
                        {card.type === 'image' && (
                          <CardActions
                            card={card}
                            onModify={(cardId, instruction) => onModifyCard?.(cardId, instruction)}
                            onRetry={(cardId, newPrompt) => onRetryCard?.(cardId, newPrompt)}
                            onSimilar={(cardId) => onSimilarCard?.(cardId)}
                            onDelete={(cardId) => onDeleteCard(cardId)}
                            onPlay={() => {}}
                            onStop={() => {}}
                          />
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
