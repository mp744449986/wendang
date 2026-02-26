# 在线文档浏览系统

一个支持 PDF/PPT/Word 文档上传、自动拆图、静态页面生成的在线文档浏览系统。

## 功能特性

- 文档上传与自动拆分（PDF、PPT、Word）
- 静态站点生成（SSG）
- 管理后台（Vue 3）
- 广告位管理
- 访问统计
- 自动备份

## 技术栈

- **后端**: Node.js + Express + PostgreSQL
- **前端**: Vue 3 + Vite + Pinia + Element Plus
- **部署**: Docker Compose + Nginx
- **公开站点**: 纯静态 HTML（SSG 生成）

## 快速开始

### 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/your-username/wendang.git
cd wendang

# 执行一键部署脚本
sudo bash scripts/deploy.sh
```

部署脚本会自动：
- 检查并安装 Docker
- 生成安全密钥和密码
- 配置环境变量
- 构建并启动服务
- 配置防火墙

### 使用 Docker Compose

```bash
# 复制环境配置
cp .env.example .env

# 编辑配置，设置密码
vim .env

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 部署脚本命令

```bash
# 执行完整部署
sudo bash scripts/deploy.sh

# 查看服务状态
sudo bash scripts/deploy.sh --status

# 重启服务
sudo bash scripts/deploy.sh --restart

# 停止服务
sudo bash scripts/deploy.sh --stop

# 更新服务
sudo bash scripts/deploy.sh --update

# 执行备份
sudo bash scripts/deploy.sh --backup
```

### 手动安装

#### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd admin-frontend && npm install && cd ..
```

#### 2. 配置数据库

```bash
# 创建数据库
createdb manualdb

# 初始化表结构
psql -d manualdb -f init.sql
```

#### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件设置必要参数
```

#### 4. 启动服务

```bash
# 启动后端
npm run dev

# 启动前端（另一个终端）
cd admin-frontend && npm run dev
```

## 访问地址

- 公开站点: http://localhost
- 管理后台: http://localhost:5173/admin
- API: http://localhost:3000/api

## 目录结构

```
.
├── src/                    # 后端源码
│   ├── server.js           # Express 入口
│   ├── config/             # 配置模块
│   ├── routes/             # API 路由
│   ├── middleware/         # 中间件
│   ├── processor/          # 文档处理器
│   ├── generator/          # SSG 生成器
│   └── backup/             # 备份模块
├── admin-frontend/         # 管理后台前端
│   └── src/
│       ├── views/          # 页面组件
│       ├── components/     # 通用组件
│       ├── api/            # API 封装
│       └── stores/         # 状态管理
├── public/                 # 静态站点输出
├── docker/                 # Docker 配置
├── scripts/                # 工具脚本
└── init.sql                # 数据库初始化
```

## API 端点

### 认证
- `POST /api/admin/login` - 登录
- `POST /api/admin/logout` - 登出
- `GET /api/admin/dashboard` - 仪表盘数据

### 手册管理
- `GET /api/manuals` - 手册列表
- `POST /api/manuals` - 创建手册
- `GET /api/manuals/:id` - 手册详情
- `PUT /api/manuals/:id` - 更新手册
- `DELETE /api/manuals/:id` - 删除手册

### 文件上传
- `POST /api/upload` - 上传文档

### 广告管理
- `GET /api/ads` - 广告位列表
- `PUT /api/ads/:id` - 更新广告位

### 统计
- `GET /api/stats` - 获取统计数据
- `POST /api/stats/record` - 记录访问

### 备份
- `GET /api/backup` - 备份列表
- `POST /api/backup/create` - 创建备份

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3000 |
| DATABASE_URL | 数据库连接 | - |
| JWT_SECRET | JWT 密钥 | - |
| ADMIN_PASSWORD | 管理员密码 | - |

## License

MIT
