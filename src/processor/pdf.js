import { fromPath } from 'pdf2pic';
import path from 'path';
import fs from 'fs/promises';

export const processPDF = async (filePath, outputDir) => {
  const options = {
    density: 150,
    saveFilename: 'page',
    savePath: outputDir,
    format: 'png',
    width: 1200,
    height: 1600,
  };

  const convert = fromPath(filePath, options);

  const pages = [];
  let pageNumber = 1;

  try {
    const metadata = await convert.bulk(-1, {
      responseType: 'image',
    });

    if (!Array.isArray(metadata)) {
      return [];
    }

    for (const result of metadata) {
      if (result && result.path) {
        const originalPath = path.join(outputDir, `page-${pageNumber}.png`);
        await fs.rename(result.path, originalPath).catch(() => {
          return result.path;
        });

        pages.push({
          pageNumber,
          originalPath,
          width: options.width,
          height: options.height,
        });

        pageNumber++;
      }
    }
  } catch (error) {
    console.error('PDF 处理错误:', error);
    throw new Error(`PDF 处理失败: ${error.message}`);
  }

  return pages;
};

export default { processPDF };
