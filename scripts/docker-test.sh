#!/bin/bash

set -e

echo "=========================================="
echo "  Docker 部署测试"
echo "=========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: curl -fsSL https://get.docker.com | bash"
    exit 1
fi

echo ""
echo "1. 检查 Docker 版本..."
docker --version
docker compose version 2>/dev/null || docker-compose --version 2>/dev/null

echo ""
echo "2. 创建测试环境配置..."
cat > .env.docker << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=docker-test-jwt-secret-key-32-characters
JWT_EXPIRES_IN=24h
ADMIN_PASSWORD=admin123
SITE_URL=http://localhost
SITE_NAME=在线文档浏览系统
EOF

echo ""
echo "3. 构建 Docker 镜像..."
docker compose build --no-cache 2>&1 || docker-compose build --no-cache 2>&1

echo ""
echo "4. 启动服务..."
docker compose up -d 2>&1 || docker-compose up -d 2>&1

echo ""
echo "5. 等待服务启动..."
sleep 10

echo ""
echo "6. 检查服务状态..."
docker compose ps 2>&1 || docker-compose ps 2>&1

echo ""
echo "7. 测试 API 健康检查..."
sleep 5
curl -s http://localhost:3000/api/health || echo "API 未就绪"

echo ""
echo ""
echo "=========================================="
echo "  测试完成"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  API: http://localhost:3000/api/health"
echo "  管理后台: http://localhost/admin"
echo ""
echo "管理命令:"
echo "  查看日志: docker compose logs -f"
echo "  停止服务: docker compose down"
echo "  重启服务: docker compose restart"
