'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useWorkspaceStore } from '@/store';
import { workspacesApi, canvasApi } from '@/lib/api';
import { Workspace, Canvas } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateCanvas, setShowCreateCanvas] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newCanvasTitle, setNewCanvasTitle] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadWorkspaces();
  }, [user]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadCanvases(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  const loadWorkspaces = async () => {
    try {
      const { data } = await workspacesApi.findAll();
      setWorkspaces(data);
      if (data.length > 0) {
        setSelectedWorkspaceId(data[0].id);
        setCurrentWorkspace(data[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  const loadCanvases = async (workspaceId: string) => {
    try {
      const { data } = await canvasApi.findAllByWorkspace(workspaceId);
      setCanvases(data);
    } catch (err) {
      console.error('Failed to load canvases:', err);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      const { data } = await workspacesApi.create({ name: newWorkspaceName });
      setWorkspaces([...workspaces, data]);
      setSelectedWorkspaceId(data.id);
      setCurrentWorkspace(data);
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  const handleCreateCanvas = async () => {
    if (!newCanvasTitle.trim() || !selectedWorkspaceId) return;
    try {
      const { data } = await canvasApi.create(selectedWorkspaceId, { title: newCanvasTitle });
      setCanvases([...canvases, data]);
      setShowCreateCanvas(false);
      setNewCanvasTitle('');
    } catch (err) {
      console.error('Failed to create canvas:', err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">UnCanvas</h1>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">工作区</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/settings/models')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            模型配置
          </button>
          <span className="text-gray-400">{user?.name || user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            退出
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <select
                value={selectedWorkspaceId || ''}
                onChange={(e) => {
                  setSelectedWorkspaceId(e.target.value);
                  const ws = workspaces.find((w) => w.id === e.target.value);
                  if (ws) setCurrentWorkspace(ws);
                }}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              {selectedWorkspaceId && (
                <button
                  onClick={() => router.push(`/dashboard/workspaces/${selectedWorkspaceId}`)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition text-sm"
                  title="工作区设置"
                >
                  设置
                </button>
              )}
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="bg-primary-600 hover:bg-primary-700 px-3 py-2 rounded-lg transition text-sm"
              >
                + 新建工作区
              </button>
            </div>
            <button
              onClick={() => setShowCreateCanvas(true)}
              className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition"
            >
              + 新建画布
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {canvases.map((canvas) => (
            <Link
              key={canvas.id}
              href={`/canvas/${canvas.id}`}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-primary-500 transition group"
            >
              <div className="aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-500 group-hover:text-primary-500 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg truncate">{canvas.title}</h3>
              <p className="text-gray-400 text-sm">
                {new Date(canvas.updatedAt).toLocaleDateString('zh-CN')}
              </p>
            </Link>
          ))}

          {canvases.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p>暂无画布，点击上方"新建画布"开始创作</p>
            </div>
          )}
        </div>
      </main>

      {showCreateWorkspace && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">新建工作区</h3>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="工作区名称"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateWorkspace(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateCanvas && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">新建画布</h3>
            <input
              type="text"
              value={newCanvasTitle}
              onChange={(e) => setNewCanvasTitle(e.target.value)}
              placeholder="画布名称"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateCanvas(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateCanvas}
                className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
