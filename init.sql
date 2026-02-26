-- 在线文档浏览系统数据库初始化脚本
-- 数据库: manualdb

-- 手册表
CREATE TABLE IF NOT EXISTS manuals (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    page_count INTEGER NOT NULL DEFAULT 0,
    file_type VARCHAR(20) DEFAULT 'pdf',
    language VARCHAR(10) DEFAULT 'zh',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_manuals_brand ON manuals(brand);
CREATE INDEX IF NOT EXISTS idx_manuals_model ON manuals(model);
CREATE INDEX IF NOT EXISTS idx_manuals_status ON manuals(status);
CREATE INDEX IF NOT EXISTS idx_manuals_category ON manuals(category);

-- 页面表
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    manual_id INTEGER REFERENCES manuals(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    image_webp VARCHAR(255) NOT NULL,
    image_width INTEGER,
    image_height INTEGER,
    section_title VARCHAR(255),
    section_description TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manual_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_pages_manual_page ON pages(manual_id, page_number);

-- 目录表
CREATE TABLE IF NOT EXISTS toc_entries (
    id SERIAL PRIMARY KEY,
    manual_id INTEGER REFERENCES manuals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_page INTEGER NOT NULL,
    end_page INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 广告配置表
CREATE TABLE IF NOT EXISTS ad_slots (
    id SERIAL PRIMARY KEY,
    slot_name VARCHAR(50) NOT NULL,
    slot_type VARCHAR(50) NOT NULL,
    ad_code TEXT,
    is_active BOOLEAN DEFAULT true,
    targeting JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 访问记录（原始）
CREATE TABLE IF NOT EXISTS page_views_raw (
    id BIGSERIAL PRIMARY KEY,
    manual_id INTEGER REFERENCES manuals(id),
    page_number INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_views_raw_viewed_at ON page_views_raw(viewed_at);

-- 访问统计（按日聚合）
CREATE TABLE IF NOT EXISTS page_views_daily (
    id SERIAL PRIMARY KEY,
    manual_id INTEGER REFERENCES manuals(id),
    page_number INTEGER,
    view_date DATE NOT NULL,
    view_count INTEGER DEFAULT 0,
    UNIQUE(manual_id, page_number, view_date)
);

-- 管理员会话表
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- 备份记录表
CREATE TABLE IF NOT EXISTS backup_records (
    id SERIAL PRIMARY KEY,
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'scheduled',
    database_path VARCHAR(255),
    images_path VARCHAR(255),
    size_bytes BIGINT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 网站设置表
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认广告位配置
INSERT INTO ad_slots (slot_name, slot_type, is_active) VALUES
    ('top-banner', 'custom', true),
    ('left-sidebar', 'custom', true),
    ('right-sidebar', 'custom', true),
    ('bottom-banner', 'custom', true)
ON CONFLICT DO NOTHING;

-- 插入默认网站设置
INSERT INTO site_settings (key, value) VALUES
    ('site_name', '在线文档浏览系统'),
    ('site_description', '专业的技术文档在线浏览平台'),
    ('admin_ips', '[]')
ON CONFLICT DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
DROP TRIGGER IF EXISTS manuals_updated_at ON manuals;
CREATE TRIGGER manuals_updated_at
    BEFORE UPDATE ON manuals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ad_slots_updated_at ON ad_slots;
CREATE TRIGGER ad_slots_updated_at
    BEFORE UPDATE ON ad_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
