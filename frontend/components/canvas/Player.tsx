'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/types';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';

interface PlayerProps {
  card: Card;
  onPlay: () => void;
  onStop: () => void;
}

export default function Player({ card, onPlay, onStop }: PlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(card.currentFrame || 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  useEffect(() => {
    setCurrentFrame(card.currentFrame || 0);
  }, [card.currentFrame]);

  useEffect(() => {
    if (card.isPlaying && card.playlist && card.playlist.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          const next = prev + 1;
          if (next >= card.playlist!.length) {
            return -1;
          }
          return next;
        });
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [card.isPlaying, card.playlist]);

  useEffect(() => {
    if (currentFrame === -1) {
      setCurrentFrame(0);
      onStopRef.current();
    }
  }, [currentFrame]);

  const currentImage = card.playlist?.[currentFrame]?.imageUrl || card.thumbnailUrl;

  if (!card.isReady || !card.playlist || card.playlist.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
        <p className="text-sm">连接卡片后可用</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="relative" style={{ height: 'calc(100% - 4rem)' }}>
        <img
          src={currentImage}
          alt={`Frame ${currentFrame + 1}`}
          className="w-full h-full object-contain"
          draggable={false}
        />
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/60 px-3 py-2 rounded-full">
          <button
            onClick={() => {
              setCurrentFrame(0);
              onStop();
            }}
            className="text-white hover:text-blue-400 transition"
          >
            <FiSkipBack size={18} />
          </button>
          <button
            onClick={() => {
              if (card.isPlaying) {
                onStop();
              } else {
                onPlay();
              }
            }}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition"
          >
            {card.isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>
          <button
            onClick={() => {
              setCurrentFrame(card.playlist!.length - 1);
              onStop();
            }}
            className="text-white hover:text-blue-400 transition"
          >
            <FiSkipForward size={18} />
          </button>
        </div>

        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs">
          {currentFrame + 1} / {card.playlist.length}
        </div>
      </div>
      
      <div className="h-16 p-2 flex space-x-1 overflow-x-auto bg-gray-800">
        {card.playlist.map((frame, idx) => (
          <button
            key={frame.id}
            onClick={() => {
              setCurrentFrame(idx);
              onStop();
            }}
            className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition ${
              idx === currentFrame ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={frame.imageUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}
