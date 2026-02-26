import express from 'express';
import { query } from '../config/database.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import config from '../config/index.js';

const router = express.Router();

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  if (password !== config.admin.password) {
    return res.status(401).json({ error: '密码错误' });
  }

  const token = generateToken({ role: 'admin', loginTime: Date.now() });

  await query(
    'INSERT INTO admin_sessions (token_hash, ip_address, expires_at) VALUES ($1, $2, $3)',
    [token.substring(0, 20) + '...', req.ip, new Date(Date.now() + 24 * 60 * 60 * 1000)]
  );

  await query(
    'INSERT INTO admin_logs (action, ip_address) VALUES ($1, $2)',
    ['login', req.ip]
  );

  res.json({
    token,
    admin: { role: 'admin' },
    expiresIn: config.jwt.expiresIn,
  });
}));

router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  await query(
    'INSERT INTO admin_logs (action, ip_address) VALUES ($1, $2)',
    ['logout', req.ip]
  );

  res.json({ message: '登出成功' });
}));

router.post('/reauth', authMiddleware, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  if (password !== config.admin.password) {
    return res.status(401).json({ error: '密码错误' });
  }

  res.json({ message: '认证成功' });
}));

router.get('/dashboard', authMiddleware, asyncHandler(async (req, res) => {
  const manualsResult = await query('SELECT COUNT(*) as total FROM manuals');
  const pagesResult = await query('SELECT COUNT(*) as total FROM pages');
  const viewsResult = await query('SELECT COALESCE(SUM(view_count), 0) as total FROM page_views_daily');
  const todayViewsResult = await query(
    'SELECT COALESCE(SUM(view_count), 0) as total FROM page_views_daily WHERE view_date = CURRENT_DATE'
  );
  const recentManualsResult = await query(
    'SELECT id, title, brand, model, status, created_at FROM manuals ORDER BY created_at DESC LIMIT 5'
  );

  res.json({
    stats: {
      totalManuals: parseInt(manualsResult.rows[0].total),
      totalPages: parseInt(pagesResult.rows[0].total),
      totalViews: parseInt(viewsResult.rows[0].total),
      todayViews: parseInt(todayViewsResult.rows[0].total),
    },
    recentManuals: recentManualsResult.rows,
  });
}));

export default router;
