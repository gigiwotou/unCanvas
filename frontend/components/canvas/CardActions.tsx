'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { FiEdit2, FiRefreshCw, FiCopy, FiTrash2, FiPlay, FiPause } from 'react-icons/fi';

interface CardActionsProps {
  card: Card;
  onModify: (cardId: string, instruction: string) => void;
  onRetry: (cardId: string, newPrompt: string) => void;
  onSimilar: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onPlay: (cardId: string) => void;
  onStop: (cardId: string) => void;
}

export default function CardActions({
  card,
  onModify,
  onRetry,
  onSimilar,
  onDelete,
  onPlay,
  onStop,
}: CardActionsProps) {
  const [showModify, setShowModify] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [retryPrompt, setRetryPrompt] = useState(card.description || '');
  const [loading, setLoading] = useState(false);

  const handleModify = async () => {
    if (!modifyPrompt.trim()) return;
    setLoading(true);
    try {
      await onModify(card.id, modifyPrompt);
      setShowModify(false);
      setModifyPrompt('');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!retryPrompt.trim()) return;
    setLoading(true);
    try {
      await onRetry(card.id, retryPrompt);
      setShowRetry(false);
    } finally {
      setLoading(false);
    }
  };

  if (card.type === 'player') {
    return (
      <div className="absolute bottom-2 right-2 flex space-x-2">
        <button
          onClick={() => card.isPlaying ? onStop(card.id) : onPlay(card.id)}
          className={`p-2 rounded-lg transition ${
            card.isPlaying 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
          disabled={!card.isReady}
        >
          {card.isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-0 right-0 px-2 flex justify-center space-x-1 bg-gradient-to-t from-gray-900/80 to-transparent pt-8 pb-2">
      {!showModify && !showRetry && (
        <>
          <button
            onClick={() => setShowModify(true)}
            className="p-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white transition"
            title="编辑"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => {
              setRetryPrompt(card.description || '');
              setShowRetry(true);
            }}
            className="p-2 rounded-lg bg-yellow-600/80 hover:bg-yellow-600 text-white transition"
            title="重试"
          >
            <FiRefreshCw size={16} />
          </button>
          <button
            onClick={() => onSimilar(card.id)}
            className="p-2 rounded-lg bg-green-600/80 hover:bg-green-600 text-white transition"
            title="复制"
          >
            <FiCopy size={16} />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition"
            title="删除"
          >
            <FiTrash2 size={16} />
          </button>
        </>
      )}

      {showModify && (
        <div className="bg-gray-800 rounded-lg p-2 w-64 space-y-2">
          <input
            type="text"
            value={modifyPrompt}
            onChange={(e) => setModifyPrompt(e.target.value)}
            placeholder="输入修改指令，如'改为夜晚'"
            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded focus:outline-none"
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleModify}
              disabled={loading || !modifyPrompt.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition disabled:opacity-50"
            >
              {loading ? '处理中...' : '确认'}
            </button>
            <button
              onClick={() => setShowModify(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {showRetry && (
        <div className="bg-gray-800 rounded-lg p-2 w-64 space-y-2">
          <textarea
            value={retryPrompt}
            onChange={(e) => setRetryPrompt(e.target.value)}
            placeholder="修改提示词"
            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded focus:outline-none h-16 resize-none"
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleRetry}
              disabled={loading || !retryPrompt.trim()}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded transition disabled:opacity-50"
            >
              {loading ? '生成中...' : '重试'}
            </button>
            <button
              onClick={() => setShowRetry(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded transition"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
