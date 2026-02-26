import { generateAll, generateManual } from '../src/generator/ssg.js';
import { query } from '../src/config/database.js';
import fs from 'fs/promises';
import path from 'path';

const command = process.argv[2];
const manualId = process.argv[3];

const run = async () => {
  try {
    await fs.mkdir('./public', { recursive: true });
    await fs.mkdir('./public/manual', { recursive: true });
    await fs.mkdir('./public/brand', { recursive: true });
    await fs.mkdir('./public/images/manuals', { recursive: true });
    await fs.mkdir('./public/data', { recursive: true });
    await fs.mkdir('./public/css', { recursive: true });
    await fs.mkdir('./public/js', { recursive: true });

    if (command === 'manual' && manualId) {
      await generateManual(parseInt(manualId));
    } else {
      await generateAll();
    }

    console.log('生成完成');
    process.exit(0);
  } catch (error) {
    console.error('生成失败:', error);
    process.exit(1);
  }
};

run();
