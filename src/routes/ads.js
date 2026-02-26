import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, slot_name, slot_type, ad_code, is_active, targeting, created_at, updated_at
     FROM ad_slots
     ORDER BY slot_name`
  );

  res.json({ ads: result.rows });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM ad_slots WHERE id = $1', [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: '广告位不存在' });
  }

  res.json({ ad: result.rows[0] });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { slot_name, slot_type, ad_code, is_active, targeting } = req.body;

  if (!slot_name || !slot_type) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const result = await query(
    `INSERT INTO ad_slots (slot_name, slot_type, ad_code, is_active, targeting)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [slot_name, slot_type, ad_code, is_active !== false, JSON.stringify(targeting || {})]
  );

  await query(
    'INSERT INTO admin_logs (action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4)',
    ['create_ad', 'ad_slot', result.rows[0].id, req.ip]
  );

  res.status(201).json({ ad: result.rows[0] });
}));

router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slot_name, slot_type, ad_code, is_active, targeting } = req.body;

  const existingResult = await query('SELECT * FROM ad_slots WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    return res.status(404).json({ error: '广告位不存在' });
  }

  const result = await query(
    `UPDATE ad_slots
     SET slot_name = COALESCE($1, slot_name),
         slot_type = COALESCE($2, slot_type),
         ad_code = COALESCE($3, ad_code),
         is_active = COALESCE($4, is_active),
         targeting = COALESCE($5, targeting),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [slot_name, slot_type, ad_code, is_active, JSON.stringify(targeting || {}), id]
  );

  await query(
    'INSERT INTO admin_logs (action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4)',
    ['update_ad', 'ad_slot', id, req.ip]
  );

  res.json({ ad: result.rows[0] });
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingResult = await query('SELECT slot_name FROM ad_slots WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    return res.status(404).json({ error: '广告位不存在' });
  }

  await query('DELETE FROM ad_slots WHERE id = $1', [id]);

  await query(
    'INSERT INTO admin_logs (action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4)',
    ['delete_ad', 'ad_slot', id, req.ip]
  );

  res.json({ message: '广告位已删除' });
}));

export default router;
