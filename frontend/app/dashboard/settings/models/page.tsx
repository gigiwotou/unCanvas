'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { modelsApi } from '@/lib/api';
import { ModelConfig } from '@/types';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiArrowLeft, FiKey } from 'react-icons/fi';

export default function ModelSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'gemini' as 'gemini' | 'openai' | 'ai302' | 'anthropic' | 'vertex',
    apiKey: '',
    apiUrl: '',
    modelName: '',
    enabled: true,
    type: 'text' as 'text' | 'image',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadConfigs();
  }, [user]);

  const loadConfigs = async () => {
    try {
      const { data } = await modelsApi.findAllConfigs();
      setConfigs(data);
    } catch (err) {
      console.error('Failed to load configs:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.apiKey.trim()) {
      alert('请填写必要信息');
      return;
    }

    try {
      if (editingId) {
        await modelsApi.updateConfig(editingId, {
          name: formData.name,
          provider: formData.provider,
          apiKey: formData.apiKey || undefined,
          apiUrl: formData.apiUrl || undefined,
          modelName: formData.modelName || undefined,
          enabled: formData.enabled,
          type: formData.type,
        });
      } else {
        await modelsApi.createConfig(formData);
      }
      
      setShowAdd(false);
      setEditingId(null);
      setFormData({
        name: '',
        provider: 'gemini',
        apiKey: '',
        apiUrl: '',
        modelName: '',
        enabled: true,
        type: 'text',
      });
      loadConfigs();
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('保存失败');
    }
  };

  const handleEdit = (config: ModelConfig) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      provider: config.provider,
      apiKey: '',
      apiUrl: config.apiUrl || '',
      modelName: config.modelName || '',
      enabled: config.enabled,
      type: config.type || 'text',
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此模型配置吗？')) return;
    
    try {
      await modelsApi.deleteConfig(id);
      loadConfigs();
    } catch (err) {
      console.error('Failed to delete config:', err);
      alert('删除失败');
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await modelsApi.updateConfig(id, { enabled });
      loadConfigs();
    } catch (err) {
      console.error('Failed to toggle config:', err);
    }
  };

  const providerOptions = {
    gemini: { name: 'Google Gemini', models: 'gemini-2.0-flash-exp' },
    openai: { name: 'OpenAI', models: 'gpt-4o, gpt-4o-mini' },
    ai302: { name: '302.AI', models: 'gpt-4o, claude-3, dall-e-3' },
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition flex items-center"
          >
            <FiArrowLeft className="mr-2" /> 返回
          </button>
          <h1 className="text-xl font-bold">模型配置</h1>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              provider: 'gemini',
              apiKey: '',
              apiUrl: '',
              modelName: '',
              enabled: true,
              type: 'text',
            });
            setShowAdd(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center transition"
        >
          <FiPlus className="mr-2" /> 添加模型
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">已配置的模型</h2>
          
          {configs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无模型配置，点击上方添加</p>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`flex items-center justify-between bg-gray-700/50 rounded-lg p-4 ${
                    !config.enabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                      <FiKey size={24} />
                    </div>
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="text-gray-400 text-sm">
                        {config.type === 'image' ? '🖼️ ' : '📝 '}
                        {providerOptions[config.provider as keyof typeof providerOptions]?.name || config.provider}
                        {config.modelName && ` - ${config.modelName}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => handleToggle(config.id, e.target.checked)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-sm">启用</span>
                    </label>

                    <button
                      onClick={() => handleEdit(config)}
                      className="text-gray-400 hover:text-blue-500 transition"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">使用说明</h2>
          <div className="text-gray-400 space-y-2 text-sm">
            <p>1. 添加模型配置需要提供 API Key</p>
            <p>2. Gemini 模型需要 Google AI Studio 的 API Key</p>
            <p>3. OpenAI 模型需要 OpenAI 账号的 API Key</p>
            <p>4. 可以在设置中切换当前使用的模型</p>
          </div>
        </div>
      </main>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? '编辑模型' : '添加模型'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">配置名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：我的 Gemini"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">模型提供商</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="ai302">302.AI</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">API Key *</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={editingId ? '留空保持不变' : '请输入 API Key'}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.provider === 'openai' && (
                <div>
                  <label className="block text-gray-400 mb-2">API 端点（可选）</label>
                  <input
                    type="text"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-2">模型类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'text' | 'image' })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">文本生成模型</option>
                  <option value="image">图像生成模型</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">模型名称（可选）</label>
                <input
                  type="text"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  placeholder={formData.provider === 'gemini' ? 'gemini-2.0-flash-exp' : 'gpt-4o'}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center transition"
              >
                <FiSave className="mr-2" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
