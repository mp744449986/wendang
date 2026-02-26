import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';
import { query } from '../config/database.js';
import config from '../config/index.js';

export const generateAll = async () => {
  console.log('开始生成静态站点...');

  await generateHomepage();
  await generateAllManualPages();
  await generateBrandListings();
  await generateSearchIndex();
  await generateSitemap();

  console.log('静态站点生成完成！');
};

export const generateManual = async (manualId) => {
  const result = await query(
    `SELECT m.*, 
     json_agg(p.* ORDER BY p.page_number) as pages
     FROM manuals m
     LEFT JOIN pages p ON m.id = p.manual_id
     WHERE m.id = $1 AND m.status = 'published'
     GROUP BY m.id`,
    [manualId]
  );

  if (result.rows.length === 0) {
    throw new Error('手册不存在或未发布');
  }

  const manual = result.rows[0];
  await generateManualPages(manual);
};

export const generateHomepage = async () => {
  const manualsResult = await query(
    `SELECT id, slug, title, brand, model, category, page_count, created_at
     FROM manuals
     WHERE status = 'published'
     ORDER BY created_at DESC
     LIMIT 12`
  );

  const brandsResult = await query(
    `SELECT brand, COUNT(*) as manual_count
     FROM manuals
     WHERE status = 'published'
     GROUP BY brand
     ORDER BY manual_count DESC
     LIMIT 20`
  );

  const categoriesResult = await query(
    `SELECT category, COUNT(*) as manual_count
     FROM manuals
     WHERE status = 'published' AND category IS NOT NULL
     GROUP BY category
     ORDER BY manual_count DESC`
  );

  const html = await renderTemplate('homepage.html', {
    siteName: config.public.siteName,
    siteUrl: config.public.siteUrl,
    manuals: manualsResult.rows,
    brands: brandsResult.rows,
    categories: categoriesResult.rows,
  });

  const outputPath = path.join(config.public.path, 'index.html');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html);
  console.log('首页生成完成');
};

export const generateManualPages = async (manual) => {
  const manualDir = path.join(config.public.path, 'manual', manual.brand.toLowerCase().replace(/\s+/g, '-'), manual.model.toLowerCase().replace(/\s+/g, '-'));
  await fs.mkdir(manualDir, { recursive: true });

  const pages = manual.pages.filter(p => p);

  for (const page of pages) {
    const html = await renderTemplate('page.html', {
      siteName: config.public.siteName,
      siteUrl: config.public.siteUrl,
      manual: {
        id: manual.id,
        title: manual.title,
        brand: manual.brand,
        model: manual.model,
        category: manual.category,
        description: manual.description,
        pageCount: manual.page_count,
      },
      page: {
        number: page.page_number,
        imageWebp: `/${page.image_webp}`,
        width: page.image_width,
        height: page.image_height,
        sectionTitle: page.section_title,
      },
      pagination: {
        current: page.page_number,
        total: pages.length,
        prev: page.page_number > 1 ? `page-${page.page_number - 1}.html` : null,
        next: page.page_number < pages.length ? `page-${page.page_number + 1}.html` : null,
      },
      toc: await getTableOfContents(manual.id),
    });

    const outputPath = path.join(manualDir, `page-${page.page_number}.html`);
    await fs.writeFile(outputPath, html);
  }

  console.log(`手册页面生成完成: ${manual.title} (${pages.length} 页)`);
};

export const generateAllManualPages = async () => {
  const result = await query(
    `SELECT m.*, 
     json_agg(p.* ORDER BY p.page_number) as pages
     FROM manuals m
     LEFT JOIN pages p ON m.id = p.manual_id
     WHERE m.status = 'published'
     GROUP BY m.id`
  );

  for (const manual of result.rows) {
    await generateManualPages(manual);
  }
};

export const generateBrandListings = async () => {
  const brandsResult = await query(
    `SELECT brand, COUNT(*) as manual_count
     FROM manuals
     WHERE status = 'published'
     GROUP BY brand
     ORDER BY brand`
  );

  for (const { brand } of brandsResult.rows) {
    const manualsResult = await query(
      `SELECT id, slug, title, brand, model, category, page_count
       FROM manuals
       WHERE status = 'published' AND brand = $1
       ORDER BY model`,
      [brand]
    );

    const html = await renderTemplate('brand-list.html', {
      siteName: config.public.siteName,
      siteUrl: config.public.siteUrl,
      brand,
      manuals: manualsResult.rows,
    });

    const brandDir = path.join(config.public.path, 'brand', brand.toLowerCase().replace(/\s+/g, '-'));
    await fs.mkdir(brandDir, { recursive: true });
    await fs.writeFile(path.join(brandDir, 'index.html'), html);
  }

  console.log('品牌列表页生成完成');
};

export const generateSearchIndex = async () => {
  const result = await query(
    `SELECT id, slug, title, brand, model, category
     FROM manuals
     WHERE status = 'published'`
  );

  const index = {
    version: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    manuals: result.rows.map(m => ({
      id: m.id,
      title: m.title,
      brand: m.brand,
      model: m.model,
      category: m.category,
      url: `/manual/${m.brand.toLowerCase().replace(/\s+/g, '-')}/${m.model.toLowerCase().replace(/\s+/g, '-')}/page-1.html`,
    })),
  };

  const dataDir = path.join(config.public.path, 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, 'search-index.json'), JSON.stringify(index, null, 2));
  console.log('搜索索引生成完成');
};

export const generateSitemap = async () => {
  const manualsResult = await query(
    `SELECT brand, model, page_count
     FROM manuals
     WHERE status = 'published'`
  );

  const urls = [config.public.siteUrl];

  for (const manual of manualsResult.rows) {
    const brandSlug = manual.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = manual.model.toLowerCase().replace(/\s+/g, '-');

    for (let i = 1; i <= manual.page_count; i++) {
      urls.push(`${config.public.siteUrl}/manual/${brandSlug}/${modelSlug}/page-${i}.html`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  await fs.writeFile(path.join(config.public.path, 'sitemap.xml'), sitemap);
  console.log('Sitemap 生成完成');
};

const renderTemplate = async (templateName, data) => {
  const templatePath = path.join(process.cwd(), 'src', 'generator', 'templates', templateName);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  return ejs.render(templateContent, data);
};

const getTableOfContents = async (manualId) => {
  const result = await query(
    `SELECT title, start_page, end_page
     FROM toc_entries
     WHERE manual_id = $1
     ORDER BY start_page`,
    [manualId]
  );
  return result.rows;
};

export default {
  generateAll,
  generateManual,
  generateHomepage,
  generateBrandListings,
  generateSearchIndex,
  generateSitemap,
};
