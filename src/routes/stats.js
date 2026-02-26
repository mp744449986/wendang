import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { period = 'day' } = req.query;

  let dateCondition = '';
  switch (period) {
    case 'week':
      dateCondition = "view_date >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case 'month':
      dateCondition = "view_date >= CURRENT_DATE - INTERVAL '30 days'";
      break;
    default:
      dateCondition = "view_date >= CURRENT_DATE - INTERVAL '1 day'";
  }

  const totalViewsResult = await query(
    `SELECT COALESCE(SUM(view_count), 0) as total FROM page_views_daily WHERE ${dateCondition}`
  );

  const dailyViewsResult = await query(
    `SELECT view_date, SUM(view_count) as views
     FROM page_views_daily
     WHERE ${dateCondition}
     GROUP BY view_date
     ORDER BY view_date`
  );

  const topManualsResult = await query(
    `SELECT m.id, m.title, m.brand, m.model, SUM(pvd.view_count) as views
     FROM page_views_daily pvd
     JOIN manuals m ON pvd.manual_id = m.id
     WHERE ${dateCondition}
     GROUP BY m.id, m.title, m.brand, m.model
     ORDER BY views DESC
     LIMIT 10`
  );

  const topPagesResult = await query(
    `SELECT m.title, pvd.page_number, SUM(pvd.view_count) as views
     FROM page_views_daily pvd
     JOIN manuals m ON pvd.manual_id = m.id
     WHERE ${dateCondition}
     GROUP BY m.title, pvd.page_number
     ORDER BY views DESC
     LIMIT 10`
  );

  res.json({
    period,
    totalViews: parseInt(totalViewsResult.rows[0].total),
    dailyViews: dailyViewsResult.rows.map(row => ({
      date: row.view_date,
      views: parseInt(row.views),
    })),
    topManuals: topManualsResult.rows.map(row => ({
      ...row,
      views: parseInt(row.views),
    })),
    topPages: topPagesResult.rows.map(row => ({
      ...row,
      views: parseInt(row.views),
    })),
  });
}));

router.post('/record', asyncHandler(async (req, res) => {
  const { manual_id, page_number, referrer } = req.body;

  if (!manual_id || page_number === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  await query(
    `INSERT INTO page_views_raw (manual_id, page_number, ip_address, user_agent, referrer)
     VALUES ($1, $2, $3, $4, $5)`,
    [manual_id, page_number, req.ip, req.headers['user-agent'], referrer]
  );

  await query(
    `INSERT INTO page_views_daily (manual_id, page_number, view_date, view_count)
     VALUES ($1, $2, CURRENT_DATE, 1)
     ON CONFLICT (manual_id, page_number, view_date)
     DO UPDATE SET view_count = page_views_daily.view_count + 1`,
    [manual_id, page_number]
  );

  res.json({ message: '记录成功' });
}));

export default router;
