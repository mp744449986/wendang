import express from 'express';
import { query, transaction } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, brand, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (status) {
    whereClause += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  if (brand) {
    whereClause += ` AND brand ILIKE $${paramIndex++}`;
    params.push(`%${brand}%`);
  }

  if (search) {
    whereClause += ` AND (title ILIKE $${paramIndex} OR model ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM manuals ${whereClause}`,
    params
  );

  const result = await query(
    `SELECT id, slug, title, brand, model, category, page_count, file_type, status, created_at, published_at
     FROM manuals ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  res.json({
    manuals: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    },
  });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT m.*, 
     json_agg(p.*) FILTER (WHERE p.id IS NOT NULL) as pages
     FROM manuals m
     LEFT JOIN pages p ON m.id = p.manual_id
     WHERE m.id = $1
     GROUP BY m.id`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: '手册不存在' });
  }

  res.json({ manual: result.rows[0] });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { slug, title, brand, model, category, description, file_type, language } = req.body;

  if (!slug || !title || !brand || !model) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const existingResult = await query('SELECT id FROM manuals WHERE slug = $1', [slug]);
  if (existingResult.rows.length > 0) {
    return res.status(409).json({ error: 'Slug 已存在' });
  }

  const result = await query(
    `INSERT INTO manuals (slug, title, brand, model, category, description, file_type, language, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
     RETURNING *`,
    [slug, title, brand, model, category, description, file_type || 'pdf', language || 'zh']
  );

  await query(
    'INSERT INTO admin_logs (action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
    ['create_manual', 'manual', result.rows[0].id, JSON.stringify({ title, brand, model }), req.ip]
  );

  res.status(201).json({ manual: result.rows[0] });
}));

router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, brand, model, category, description, status, slug } = req.body;

  const existingResult = await query('SELECT * FROM manuals WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    return res.status(404).json({ error: '手册不存在' });
  }

  if (slug && slug !== existingResult.rows[0].slug) {
    const slugCheckResult = await query('SELECT id FROM manuals WHERE slug = $1 AND id != $2', [slug, id]);
    if (slugCheckResult.rows.length > 0) {
      return res.status(409).json({ error: 'Slug 已存在' });
    }
  }

  const result = await query(
    `UPDATE manuals 
     SET title = COALESCE($1, title),
         brand = COALESCE($2, brand),
         model = COALESCE($3, model),
         category = COALESCE($4, category),
         description = COALESCE($5, description),
         status = COALESCE($6, status),
         slug = COALESCE($7, slug),
         published_at = CASE WHEN $6 = 'published' AND status != 'published' THEN CURRENT_TIMESTAMP ELSE published_at END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [title, brand, model, category, description, status, slug, id]
  );

  await query(
    'INSERT INTO admin_logs (action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4)',
    ['update_manual', 'manual', id, req.ip]
  );

  res.json({ manual: result.rows[0] });
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingResult = await query('SELECT title FROM manuals WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    return res.status(404).json({ error: '手册不存在' });
  }

  await transaction(async (client) => {
    await client.query('DELETE FROM pages WHERE manual_id = $1', [id]);
    await client.query('DELETE FROM toc_entries WHERE manual_id = $1', [id]);
    await client.query('DELETE FROM manuals WHERE id = $1', [id]);
    
    await client.query(
      'INSERT INTO admin_logs (action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['delete_manual', 'manual', id, JSON.stringify({ title: existingResult.rows[0].title }), req.ip]
    );
  });

  res.json({ message: '手册已删除' });
}));

router.get('/:id/pages', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, page_number, image_webp, image_width, image_height, section_title, seo_title
     FROM pages
     WHERE manual_id = $1
     ORDER BY page_number`,
    [req.params.id]
  );

  res.json({ pages: result.rows });
}));

export default router;
