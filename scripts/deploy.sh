#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示 Banner
show_banner() {
    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}    在线文档浏览系统 - 一键部署脚本${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
}

# 检查系统
check_system() {
    log_info "检查系统环境..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
        log_info "操作系统: $PRETTY_NAME"
    else
        log_error "无法识别操作系统"
        exit 1
    fi
}

# 检查 root 权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 权限运行此脚本"
        log_info "使用命令: sudo bash scripts/deploy.sh"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    local missing=()
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("docker-compose")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_warning "缺少依赖: ${missing[*]}"
        install_dependencies "${missing[@]}"
    else
        log_success "所有依赖已安装"
    fi
}

# 安装依赖
install_dependencies() {
    local deps=("$@")
    
    log_info "安装依赖: ${deps[*]}"
    
    case $OS in
        ubuntu|debian)
            apt update
            for dep in "${deps[@]}"; do
                case $dep in
                    docker)
                        log_info "安装 Docker..."
                        curl -fsSL https://get.docker.com | bash
                        usermod -aG docker $SUDO_USER 2>/dev/null || true
                        ;;
                    docker-compose)
                        log_info "安装 Docker Compose..."
                        apt install -y docker-compose-plugin || apt install -y docker-compose
                        ;;
                esac
            done
            ;;
        centos|rhel)
            yum install -y epel-release
            for dep in "${deps[@]}"; do
                case $dep in
                    docker)
                        log_info "安装 Docker..."
                        yum install -y docker
                        systemctl start docker
                        systemctl enable docker
                        ;;
                    docker-compose)
                        log_info "安装 Docker Compose..."
                        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                        chmod +x /usr/local/bin/docker-compose
                        ;;
                esac
            done
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
    
    log_success "依赖安装完成"
}

# 生成随机密码
generate_password() {
    openssl rand -base64 12 | tr -d '/+=' | head -c 16
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    if [ -f .env ]; then
        log_warning ".env 文件已存在"
        read -p "是否覆盖现有配置? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "保留现有配置"
            return
        fi
    fi
    
    # 生成安全密钥
    local JWT_SECRET=$(openssl rand -hex 32)
    local ADMIN_PASSWORD=$(generate_password)
    local DB_PASSWORD=$(generate_password)
    
    # 获取用户输入
    read -p "请输入域名 (例如: example.com，留空使用 IP): " DOMAIN
    read -p "请输入管理员密码 (留空自动生成): " CUSTOM_ADMIN_PASSWORD
    
    if [ -n "$CUSTOM_ADMIN_PASSWORD" ]; then
        ADMIN_PASSWORD=$CUSTOM_ADMIN_PASSWORD
    fi
    
    # 创建 .env 文件
    cat > .env << EOF
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=postgres://manual:${DB_PASSWORD}@db:5432/manualdb

# JWT 配置
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# 管理员配置
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# 备份配置
BACKUP_SCHEDULE=0 3 * * 0
BACKUP_RETENTION_COUNT=4

# 文件上传配置
MAX_FILE_SIZE=209715200

# 静态站点配置
SITE_URL=http://${DOMAIN:-localhost}
SITE_NAME=在线文档浏览系统
EOF
    
    # 保存密码信息
    cat > .credentials << EOF
# 凭证信息 - 请妥善保存
# 生成时间: $(date)

管理员密码: ${ADMIN_PASSWORD}
数据库密码: ${DB_PASSWORD}
JWT 密钥: ${JWT_SECRET}

# 访问地址
公开站点: http://${DOMAIN:-localhost}
管理后台: http://${DOMAIN:-localhost}/admin
EOF
    
    chmod 600 .credentials
    
    log_success "环境配置完成"
    echo ""
    log_warning "========================================"
    log_warning "  请保存以下重要信息"
    log_warning "========================================"
    echo -e "${YELLOW}管理员密码: ${ADMIN_PASSWORD}${NC}"
    echo -e "${YELLOW}数据库密码: ${DB_PASSWORD}${NC}"
    log_warning "========================================"
    echo ""
}

# 构建 Docker 镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    if docker compose version &> /dev/null; then
        docker compose build
    else
        docker-compose build
    fi
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    
    log_info "等待服务启动..."
    sleep 10
    
    log_success "服务启动完成"
}

# 检查服务状态
check_status() {
    log_info "检查服务状态..."
    
    echo ""
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
    echo ""
    
    # 检查健康状态
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    
    if [ "$api_status" = "200" ]; then
        log_success "API 服务运行正常"
    else
        log_warning "API 服务可能未就绪 (HTTP $api_status)"
    fi
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    case $OS in
        ubuntu|debian)
            if command -v ufw &> /dev/null; then
                ufw allow 80/tcp
                ufw allow 443/tcp
                ufw --force enable
                log_success "防火墙配置完成 (ufw)"
            fi
            ;;
        centos|rhel)
            if command -v firewall-cmd &> /dev/null; then
                firewall-cmd --permanent --add-service=http
                firewall-cmd --permanent --add-service=https
                firewall-cmd --reload
                log_success "防火墙配置完成 (firewalld)"
            fi
            ;;
    esac
}

# 显示完成信息
show_complete() {
    local DOMAIN=$(grep SITE_URL .env | cut -d'=' -f2 | sed 's|http://||' | sed 's|https://||')
    local ADMIN_PASSWORD=$(grep ADMIN_PASSWORD .env | cut -d'=' -f2)
    
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}    部署完成！${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    echo "访问地址:"
    echo -e "  公开站点: ${BLUE}http://${DOMAIN}${NC}"
    echo -e "  管理后台: ${BLUE}http://${DOMAIN}/admin${NC}"
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
    echo -e "${YELLOW}凭证信息已保存在 .credentials 文件中${NC}"
    echo ""
}

# 主函数
main() {
    show_banner
    check_system
    check_root
    check_dependencies
    setup_environment
    build_images
    start_services
    setup_firewall
    check_status
    show_complete
}

# 帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示帮助信息"
    echo "  -s, --status    查看服务状态"
    echo "  -r, --restart   重启服务"
    echo "  -S, --stop      停止服务"
    echo "  -u, --update    更新服务"
    echo "  -b, --backup    执行备份"
    echo ""
    echo "示例:"
    echo "  $0              # 执行完整部署"
    echo "  $0 --status     # 查看服务状态"
    echo "  $0 --restart    # 重启服务"
    echo ""
}

# 查看状态
show_status() {
    echo "服务状态:"
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
    echo ""
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
    echo ""
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    if docker compose version &> /dev/null; then
        docker compose restart
    else
        docker-compose restart
    fi
    log_success "服务已重启"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    log_success "服务已停止"
}

# 更新服务
update_services() {
    log_info "更新服务..."
    git pull
    build_images
    restart_services
    log_success "服务已更新"
}

# 执行备份
do_backup() {
    log_info "执行备份..."
    if docker compose version &> /dev/null; then
        docker compose exec api npm run backup
    else
        docker-compose exec api npm run backup
    fi
    log_success "备份完成"
}

# 解析参数
case "$1" in
    -h|--help)
        show_help
        ;;
    -s|--status)
        show_status
        ;;
    -r|--restart)
        restart_services
        ;;
    -S|--stop)
        stop_services
        ;;
    -u|--update)
        update_services
        ;;
    -b|--backup)
        do_backup
        ;;
    *)
        main
        ;;
esac
