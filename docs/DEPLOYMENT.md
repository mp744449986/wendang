# 部署文档

## 目录

1. [环境要求](#环境要求)
2. [快速部署（Docker）](#快速部署docker)
3. [手动部署](#手动部署)
4. [配置说明](#配置说明)
5. [Nginx 配置](#nginx-配置)
6. [数据库配置](#数据库配置)
7. [SSL 证书配置](#ssl-证书配置)
8. [常见问题](#常见问题)

---

## 环境要求

### 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 50 GB | 100 GB+ |
| 系统 | Ubuntu 20.04+ / CentOS 7+ | Ubuntu 22.04 |

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- 或手动安装：
  - Node.js 20+
  - PostgreSQL 15+
  - Nginx 1.20+
  - LibreOffice（用于文档转换）

---

## 快速部署（Docker）

### 1. 克隆项目

```bash
git clone https://github.com/your-username/wendang.git
cd wendang
```

### 2. 创建环境配置

```bash
cp .env.example .env
```

### 3. 生成安全密钥

```bash
# 生成 JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)

# 生成管理员密码
ADMIN_PASSWORD=$(openssl rand -base64 12)

# 生成数据库密码
DB_PASSWORD=$(openssl rand -base64 16)

# 更新 .env 文件
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" .env
sed -i "s/DB_PASSWORD:-manual123/DB_PASSWORD:-$DB_PASSWORD/" .env

echo "========================================"
echo "管理员密码: $ADMIN_PASSWORD"
echo "数据库密码: $DB_PASSWORD"
echo "========================================"
echo "请妥善保存以上信息！"
```

### 4. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 5. 初始化数据库

```bash
# 数据库会自动初始化，如需手动执行：
docker-compose exec db psql -U manual -d manualdb -f /docker-entrypoint-initdb.d/init.sql
```

### 6. 访问服务

- 公开站点：http://your-server-ip
- 管理后台：http://your-server-ip/admin

---

## 手动部署

### 1. 安装依赖

#### Ubuntu/Debian

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PostgreSQL 15
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-15

# 安装 LibreOffice（文档转换）
apt install -y libreoffice libreoffice-writer libreoffice-impress

# 安装 Nginx
apt install -y nginx

# 安装其他依赖
apt install -y imagemagick ghostscript poppler-utils
```

#### CentOS/RHEL

```bash
# 安装 Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 安装 PostgreSQL 15
yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
yum install -y postgresql15-server postgresql15
/usr/pgsql-15/bin/postgresql-15-setup initdb
systemctl enable postgresql-15
systemctl start postgresql-15

# 安装其他依赖
yum install -y libreoffice libreoffice-writer libreoffice-impress nginx
```

### 2. 创建数据库

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE USER manual WITH PASSWORD 'your_password';
CREATE DATABASE manualdb OWNER manual;
GRANT ALL PRIVILEGES ON DATABASE manualdb TO manual;
\q

# 导入表结构
psql -U manual -d manualdb -f init.sql
```

### 3. 部署后端

```bash
# 克隆项目
git clone https://github.com/your-username/wendang.git
cd wendang

# 安装依赖
npm install --production

# 创建环境配置
cp .env.example .env
vim .env

# 创建必要目录
mkdir -p public/images/manuals uploads backups

# 使用 PM2 管理进程
npm install -g pm2
pm2 start src/server.js --name manual-api
pm2 save
pm2 startup
```

### 4. 构建前端

```bash
cd admin-frontend
npm install
npm run build
```

### 5. 配置 Nginx

```bash
# 复制配置文件
cp docker/nginx.conf /etc/nginx/nginx.conf

# 或创建新配置
vim /etc/nginx/sites-available/manual-viewer
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/manual-viewer/public;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 静态文件
    location / {
        try_files $uri $uri/ =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片缓存
    location /images/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 管理后台
    location /admin {
        alias /var/www/manual-viewer/admin-frontend/dist;
        try_files $uri $uri/ /admin/index.html;
    }
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/manual-viewer /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 配置说明

### 环境变量 (.env)

| 变量 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| NODE_ENV | 运行环境 | 否 | development |
| PORT | 服务端口 | 否 | 3000 |
| DATABASE_URL | 数据库连接 | 是 | - |
| JWT_SECRET | JWT 密钥（32位以上） | 是 | - |
| JWT_EXPIRES_IN | Token 有效期 | 否 | 24h |
| ADMIN_PASSWORD | 管理员密码 | 是 | - |
| ADMIN_IPS | IP 白名单 | 否 | - |
| MAX_FILE_SIZE | 最大文件大小 | 否 | 209715200 |
| SITE_URL | 网站地址 | 否 | http://localhost |
| SITE_NAME | 网站名称 | 否 | 在线文档浏览系统 |

### 数据库连接格式

```
postgres://用户名:密码@主机:端口/数据库名
```

示例：
```
DATABASE_URL=postgres://manual:password@localhost:5432/manualdb
```

---

## Nginx 配置

### 性能优化

```nginx
# /etc/nginx/nginx.conf

worker_processes auto;
worker_connections 1024;

http {
    # 开启文件高效传输
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 连接超时
    keepalive_timeout 65;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
    
    # 缓冲区设置
    client_body_buffer_size 128k;
    client_max_body_size 200m;
}
```

### 安全头配置

```nginx
server {
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

---

## 数据库配置

### 性能调优

编辑 `/etc/postgresql/15/main/postgresql.conf`：

```ini
# 内存设置
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

# 连接设置
max_connections = 100

# 日志设置
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d.log'
```

### 访问控制

编辑 `/etc/postgresql/15/main/pg_hba.conf`：

```
# 只允许本地连接
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### 定期备份

```bash
# 创建备份脚本
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/backups/postgresql
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U manual manualdb | gzip > $BACKUP_DIR/manualdb_$DATE.sql.gz
# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# 添加定时任务（每天凌晨 3 点备份）
echo "0 3 * * * root /usr/local/bin/backup-db.sh" >> /etc/crontab
```

---

## SSL 证书配置

### 使用 Let's Encrypt（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 手动配置 SSL

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 常见问题

### 1. 文档转换失败

**问题**：上传 PPT/Word 文件后转换失败

**解决方案**：
```bash
# 检查 LibreOffice 是否安装
libreoffice --version

# 检查 ImageMagick 权限
vim /etc/ImageMagick-6/policy.xml
# 将 PDF 权限改为允许
<policy domain="coder" rights="read|write" pattern="PDF" />
```

### 2. 数据库连接失败

**问题**：启动时报数据库连接错误

**解决方案**：
```bash
# 检查 PostgreSQL 状态
systemctl status postgresql

# 检查连接
psql -U manual -d manualdb -h localhost

# 检查防火墙
ufw allow 5432
```

### 3. 文件上传失败

**问题**：上传大文件失败

**解决方案**：
```nginx
# 调整 Nginx 配置
client_max_body_size 200M;

# 调整 PHP 配置（如果使用）
upload_max_filesize = 200M
post_max_size = 200M
```

### 4. 内存不足

**问题**：文档处理时内存不足

**解决方案**：
```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096"

# 或在 PM2 中配置
pm2 start src/server.js --node-args="--max-old-space-size=4096"
```

### 5. 权限问题

**问题**：无法写入文件

**解决方案**：
```bash
# 设置目录权限
chown -R www-data:www-data public uploads backups
chmod -R 755 public uploads backups
```

---

## 监控与日志

### 日志位置

| 服务 | 日志路径 |
|------|---------|
| 后端 API | `/var/log/manual-api/` |
| Nginx | `/var/log/nginx/` |
| PostgreSQL | `/var/log/postgresql/` |

### 健康检查

```bash
# 检查 API 状态
curl http://localhost:3000/api/health

# 检查数据库连接
docker-compose exec db pg_isready -U manual

# 检查磁盘空间
df -h
```

### PM2 监控

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs manual-api

# 监控面板
pm2 monit
```

---

## 更新升级

### Docker 部署更新

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build
docker-compose up -d

# 运行数据库迁移（如有）
docker-compose exec api npm run migrate
```

### 手动部署更新

```bash
# 拉取最新代码
git pull

# 更新后端依赖
npm install --production

# 更新前端
cd admin-frontend
npm install
npm run build

# 重启服务
pm2 restart manual-api
```

---

## 联系支持

如遇到部署问题，请：
1. 查看日志文件
2. 参考常见问题部分
3. 提交 Issue 到 GitHub 仓库
