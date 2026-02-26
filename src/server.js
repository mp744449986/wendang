import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import manualRoutes from './routes/manuals.js';
import uploadRoutes from './routes/upload.js';
import adRoutes from './routes/ads.js';
import statsRoutes from './routes/stats.js';
import backupRoutes from './routes/backup.js';
import { initDatabase } from './config/database.js';
import expressStatic from 'express-static';

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

app.use('/admin', expressStatic('./admin-frontend/dist'));
app.get('/admin/*', (req, res) => {
  res.sendFile('index.html', { root: './admin-frontend/dist' });
});

app.use(expressStatic('./public'));

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    if (config.database.url) {
      await initDatabase();
    } else {
      console.log('No database configured, starting in demo mode...');
    }
    
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Admin panel: http://localhost:${config.port}/admin`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.log('Starting server without database...');
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} (demo mode)`);
    });
  }
};

startServer();

export default app;
