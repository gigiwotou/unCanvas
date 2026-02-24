'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore, useWorkspaceStore } from '@/store';
import { workspacesApi, usersApi } from '@/lib/api';
import { Workspace, WorkspaceMember, User } from '@/types';
import { FiUsers, FiPlus, FiTrash2, FiEdit2, FiArrowLeft, FiShield } from 'react-icons/fi';

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { user } = useAuthStore();
  const { workspaces, setWorkspaces } = useWorkspaceStore();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'editor' | 'viewer' | 'admin'>('viewer');
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadWorkspace();
    loadMembers();
    loadAllUsers();
  }, [user, workspaceId]);

  const loadWorkspace = async () => {
    try {
      const { data } = await workspacesApi.findOne(workspaceId);
      setWorkspace(data);
    } catch (err) {
      console.error('Failed to load workspace:', err);
      router.push('/dashboard');
    }
  };

  const loadMembers = async () => {
    try {
      const { data } = await workspacesApi.getMembers(workspaceId);
      setMembers(data);
      
      const currentMember = data.find((m: WorkspaceMember) => m.userId === user?.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data } = await usersApi.findAll();
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    
    const selectedUser = allUsers.find(u => u.email === newMemberEmail);
    if (!selectedUser) {
      alert('用户不存在');
      return;
    }

    try {
      await workspacesApi.addMember(workspaceId, {
        userId: selectedUser.id,
        role: newMemberRole,
      });
      setShowAddMember(false);
      setNewMemberEmail('');
      setNewMemberRole('viewer');
      loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || '添加成员失败');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('确定要移除该成员吗？')) return;
    
    try {
      await workspacesApi.removeMember(workspaceId, memberUserId);
      loadMembers();
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('移除成员失败');
    }
  };

  const handleUpdateRole = async (memberUserId: string, role: 'editor' | 'viewer' | 'admin') => {
    try {
      await workspacesApi.updateMemberRole(workspaceId, memberUserId, { role });
      loadMembers();
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('更新角色失败');
    }
  };

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

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
          <h1 className="text-xl font-bold">工作区设置</h1>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {workspace && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">工作区信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">名称</label>
                <p className="text-lg">{workspace.name}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">描述</label>
                <p className="text-lg">{workspace.description || '无'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center">
              <FiUsers className="mr-2" /> 成员管理
            </h2>
            {canManage && (
              <button
                onClick={() => setShowAddMember(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center transition"
              >
                <FiPlus className="mr-2" /> 添加成员
              </button>
            )}
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    {member.user?.name?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{member.user?.name || member.user?.email}</p>
                    <p className="text-gray-400 text-sm">{member.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {canManage && member.role !== 'owner' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.userId, e.target.value as any)}
                      className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm border border-gray-600"
                    >
                      <option value="viewer">查看者</option>
                      <option value="editor">编辑者</option>
                      <option value="admin">管理员</option>
                    </select>
                  ) : (
                    <span className="flex items-center text-sm text-gray-400">
                      <FiShield className="mr-1" />
                      {member.role === 'owner' ? '所有者' : 
                       member.role === 'admin' ? '管理员' : 
                       member.role === 'editor' ? '编辑者' : '查看者'}
                    </span>
                  )}

                  {canManage && member.role !== 'owner' && member.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddMember && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">添加成员</h3>
              
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">用户邮箱</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  list="users-list"
                />
                <datalist id="users-list">
                  {allUsers.map(u => (
                    <option key={u.id} value={u.email} />
                  ))}
                </datalist>
              </div>

              <div className="mb-6">
                <label className="block text-gray-400 mb-2">角色</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">查看者 - 仅能查看画布</option>
                  <option value="editor">编辑者 - 可以编辑画布内容</option>
                  <option value="admin">管理员 - 可以管理成员</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMember}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
