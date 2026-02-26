import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from '../config/index.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import authRoutes from '../routes/auth.js';
import manualRoutes from '../routes/manuals.js';
import uploadRoutes from '../routes/upload.js';
import adRoutes from '../routes/ads.js';
import statsRoutes from '../routes/stats.js';
import backupRoutes from '../routes/backup.js';
import { initDatabase } from './database.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.nodeEnv === 'production' ? config.public.siteUrl : '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/admin', authRoutes);
app.use('/api/manuals', apiLimiter, manualRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/ads', apiLimiter, adRoutes);
app.use('/api/stats', apiLimiter, statsRoutes);
app.use('/api/backup', apiLimiter, backupRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(config.port, () => {
      console.log(`服务器运行在端口 ${config.port}`);
      console.log(`环境: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
