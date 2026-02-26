#!/bin/bash

set -e

echo "=========================================="
echo "  在线文档浏览系统 - 一键安装"
echo "=========================================="

if ! command -v docker &> /dev/null; then
    echo "错误: 请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: 请先安装 Docker Compose"
    exit 1
fi

if [ ! -f .env ]; then
    echo "创建环境配置文件..."
    cp .env.example .env

    JWT_SECRET=$(openssl rand -hex 32)
    ADMIN_PASSWORD=$(openssl rand -base64 12)
    DB_PASSWORD=$(openssl rand -base64 16)

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i '' "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" .env
        sed -i '' "s/DB_PASSWORD:-manual123/DB_PASSWORD:-$DB_PASSWORD/" .env
    else
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" .env
        sed -i "s/DB_PASSWORD:-manual123/DB_PASSWORD:-$DB_PASSWORD/" .env
    fi

    echo ""
    echo "重要: 请保存以下信息"
    echo "----------------------------------------"
    echo "管理员密码: $ADMIN_PASSWORD"
    echo "数据库密码: $DB_PASSWORD"
    echo "----------------------------------------"
fi

echo "构建 Docker 镜像..."
if docker compose version &> /dev/null; then
    docker compose build
else
    docker-compose build
fi

echo "启动服务..."
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo "等待数据库初始化..."
sleep 10

echo ""
echo "=========================================="
echo "  安装完成!"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  公开站点: http://localhost"
echo "  管理后台 API: http://localhost/api"
echo ""
echo "管理命令:"
if docker compose version &> /dev/null; then
    echo "  查看日志: docker compose logs -f"
    echo "  停止服务: docker compose down"
    echo "  重启服务: docker compose restart"
else
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
fi
echo ""
