import dotenv from 'dotenv';
dotenv.config();

export default {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  admin: {
    password: process.env.ADMIN_PASSWORD || 'admin123',
    ips: process.env.ADMIN_IPS ? process.env.ADMIN_IPS.split(',').map(ip => ip.trim()) : [],
  },
  
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024,
    path: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['.pdf', '.ppt', '.pptx', '.doc', '.docx'],
  },
  
  backup: {
    schedule: process.env.BACKUP_SCHEDULE || '0 3 * * 0',
    retentionCount: parseInt(process.env.BACKUP_RETENTION_COUNT) || 4,
    path: process.env.BACKUP_PATH || './backups',
  },
  
  public: {
    path: process.env.PUBLIC_PATH || './public',
    siteUrl: process.env.SITE_URL || 'http://localhost',
    siteName: process.env.SITE_NAME || '在线文档浏览系统',
  },
  
  rateLimit: {
    login: {
      windowMs: 60 * 1000,
      max: 5,
    },
    api: {
      windowMs: 60 * 1000,
      max: 100,
    },
  },
};
