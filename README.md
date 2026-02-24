# UnCanvas - 无限画布

AI驱动的无限画布创作工具，支持多用户协同工作，可配置连接主流模型 API。

## 功能特性

- 用户认证与权限管理
- 多租户工作区
- 无限画布创作
- 分镜卡片管理
- AI 剧本生成
- AI 图片生成
- 多用户实时协作
- 支持多种模型 API（Gemini、OpenAI）

## 技术栈

- **前端**: Next.js 14 + React + TypeScript + TailwindCSS
- **后端**: NestJS + TypeScript + PostgreSQL + TypeORM
- **部署**: Docker + Kubernetes

## 快速开始

### 本地开发 (Docker Compose)

```bash
# 克隆项目后，进入目录
cd unCanvas

# 启动所有服务
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端 API: http://localhost:3001
# API 文档: http://localhost:3001/api
```

### 手动启动

#### 后端

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 启动 PostgreSQL (或使用本地数据库)
# 编辑 .env 配置数据库连接

# 运行开发服务器
npm run start:dev
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

## Kubernetes 部署

```bash
cd kubernetes

# 部署到 Kubernetes
./deploy.sh
```

## API 配置

启动后，在管理界面添加模型 API 配置：

1. 访问 `/dashboard`
2. 进入设置或模型管理页面
3. 添加模型配置（API Key、模型名称等）
4. 支持的提供商：
   - Google Gemini
   - OpenAI
   - Anthropic (即将支持)
   - Google Vertex AI (即将支持)

## 项目结构

```
unCanvas/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── auth/          # 认证模块
│   │   ├── users/         # 用户模块
│   │   ├── workspaces/    # 工作区模块
│   │   ├── canvas/        # 画布模块
│   │   ├── models/        # 模型适配器模块
│   │   └── collaboration/ # 实时协作模块
│   └── Dockerfile
├── frontend/              # Next.js 前端
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   ├── store/           # Zustand 状态管理
│   ├── lib/             # 工具库
│   └── Dockerfile
├── kubernetes/           # Kubernetes 部署配置
└── docker-compose.yml   # Docker Compose 配置
```

## 核心模块说明

### 认证系统
- JWT 认证
- 角色权限（Owner、Admin、Editor、Viewer）

### 工作区
- 多租户支持
- 成员管理
- 权限控制

### 画布系统
- 无限画布视图
- 分镜管理
- 卡片管理
- 连线功能

### AI 功能
- 剧本生成
- 图片生成
- 图片修改
- 相似图生成

### 实时协作
- WebSocket 实时同步
- Yjs CRDT 支持
- 多人在线显示

## 环境变量

### 后端 (.env)
```
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=uncanvas
DB_PASSWORD=uncanvas
DB_DATABASE=uncanvas

JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### 前端 (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 许可证

MIT License
