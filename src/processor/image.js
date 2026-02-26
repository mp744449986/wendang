import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export const optimizeImage = async (inputPath, outputDir, pageNumber) => {
  const webpPath = path.join(outputDir, `page-${pageNumber}.webp`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let width = metadata.width;
    let height = metadata.height;

    const maxWidth = 1200;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 4,
      })
      .toFile(webpPath);

    return webpPath;
  } catch (error) {
    console.error('图片优化错误:', error);
    
    try {
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(webpPath);
      return webpPath;
    } catch (fallbackError) {
      throw new Error(`图片优化失败: ${error.message}`);
    }
  }
};

export const getImageMetadata = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    throw new Error(`获取图片元数据失败: ${error.message}`);
  }
};

export default { optimizeImage, getImageMetadata };
