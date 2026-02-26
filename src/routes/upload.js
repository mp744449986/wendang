import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import config from '../config/index.js';
import { processDocument } from '../processor/index.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = config.upload.path;
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (config.upload.allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

router.post('/', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择文件' });
  }

  const { manual_id } = req.body;

  if (!manual_id) {
    return res.status(400).json({ error: '缺少手册 ID' });
  }

  const manualResult = await query('SELECT * FROM manuals WHERE id = $1', [manual_id]);
  if (manualResult.rows.length === 0) {
    return res.status(404).json({ error: '手册不存在' });
  }

  const manual = manualResult.rows[0];
  const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);

  try {
    const processResult = await processDocument({
      filePath: req.file.path,
      fileType,
      manualId: manual_id,
      outputDir: path.join(config.public.path, 'images', 'manuals', manual_id.toString()),
    });

    await query(
      'UPDATE manuals SET page_count = $1, file_type = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [processResult.pageCount, fileType, 'published', manual_id]
    );

    for (const page of processResult.pages) {
      await query(
        `INSERT INTO pages (manual_id, page_number, image_webp, image_width, image_height)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (manual_id, page_number) DO UPDATE SET
           image_webp = EXCLUDED.image_webp,
           image_width = EXCLUDED.image_width,
           image_height = EXCLUDED.image_height`,
        [manual_id, page.pageNumber, page.webpPath, page.width, page.height]
      );
    }

    await query(
      'INSERT INTO admin_logs (action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
      ['upload_document', 'manual', manual_id, JSON.stringify({ pageCount: processResult.pageCount }), req.ip]
    );

    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      message: '文档处理完成',
      pageCount: processResult.pageCount,
      pages: processResult.pages,
    });
  } catch (error) {
    console.error('文档处理失败:', error);
    await fs.unlink(req.file.path).catch(() => {});
    res.status(500).json({ error: `文档处理失败: ${error.message}` });
  }
}));

router.get('/status/:uploadId', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    uploadId: req.params.uploadId,
    status: 'processing',
    progress: 50,
  });
}));

export default router;
