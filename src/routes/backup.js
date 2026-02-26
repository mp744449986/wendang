import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware, requireReauth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT backup_id, type, database_path, images_path, size_bytes, status, error_message, started_at, completed_at
     FROM backup_records
     ORDER BY started_at DESC
     LIMIT 20`
  );

  res.json({ backups: result.rows });
}));

router.post('/create', authMiddleware, asyncHandler(async (req, res) => {
  const { include_images = true, include_public = false } = req.body;

  const backupId = `backup-${Date.now()}`;

  await query(
    `INSERT INTO backup_records (backup_id, type, status) VALUES ($1, 'manual', 'pending')`,
    [backupId]
  );

  res.json({
    message: '备份任务已创建',
    backup_id: backupId,
    note: '请使用 npm run backup 命令执行备份',
  });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM backup_records WHERE backup_id = $1', [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: '备份记录不存在' });
  }

  res.json({ backup: result.rows[0] });
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM backup_records WHERE backup_id = $1 RETURNING *', [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: '备份记录不存在' });
  }

  res.json({ message: '备份记录已删除' });
}));

router.get('/settings', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    "SELECT key, value FROM site_settings WHERE key LIKE 'backup_%'"
  );

  const settings = {};
  result.rows.forEach(row => {
    settings[row.key] = row.value;
  });

  res.json({ settings });
}));

export default router;
