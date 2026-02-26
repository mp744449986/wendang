import path from 'path';
import fs from 'fs/promises';
import { processPDF } from './pdf.js';
import { processPPT } from './ppt.js';
import { processDOC } from './doc.js';
import { optimizeImage } from './image.js';

export const processDocument = async ({ filePath, fileType, manualId, outputDir }) => {
  await fs.mkdir(outputDir, { recursive: true });

  let pages = [];

  switch (fileType) {
    case 'pdf':
      pages = await processPDF(filePath, outputDir);
      break;
    case 'ppt':
    case 'pptx':
      pages = await processPPT(filePath, outputDir);
      break;
    case 'doc':
    case 'docx':
      pages = await processDOC(filePath, outputDir);
      break;
    default:
      throw new Error(`不支持的文件类型: ${fileType}`);
  }

  const optimizedPages = [];
  for (const page of pages) {
    const webpPath = await optimizeImage(page.originalPath, outputDir, page.pageNumber);
    const stats = await fs.stat(webpPath);
    
    optimizedPages.push({
      pageNumber: page.pageNumber,
      originalPath: page.originalPath,
      webpPath: path.relative(path.join(outputDir, '../..'), webpPath),
      width: page.width,
      height: page.height,
      fileSize: stats.size,
    });

    if (page.originalPath !== webpPath) {
      await fs.unlink(page.originalPath).catch(() => {});
    }
  }

  return {
    pageCount: optimizedPages.length,
    pages: optimizedPages,
  };
};

export default { processDocument };
