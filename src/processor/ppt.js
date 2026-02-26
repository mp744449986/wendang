import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export const processPPT = async (filePath, outputDir) => {
  const tempDir = path.join(outputDir, 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    const { stdout, stderr } = await execAsync(
      `libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${filePath}"`,
      { timeout: 120000 }
    );

    const baseName = path.basename(filePath, path.extname(filePath));
    const pdfPath = path.join(tempDir, `${baseName}.pdf`);

    const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
    if (!pdfExists) {
      const files = await fs.readdir(tempDir);
      const pdfFile = files.find(f => f.endsWith('.pdf'));
      if (pdfFile) {
        await fs.rename(path.join(tempDir, pdfFile), pdfPath);
      } else {
        throw new Error('PPT 转 PDF 失败：找不到输出文件');
      }
    }

    const { processPDF } = await import('./pdf.js');
    const pages = await processPDF(pdfPath, outputDir);

    await fs.rm(tempDir, { recursive: true, force: true });

    return pages;
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`PPT 处理失败: ${error.message}`);
  }
};

export default { processPPT };
