import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { query } from '../config/database.js';
import config from '../config/index.js';

const execAsync = promisify(exec);

export class BackupManager {
  constructor() {
    this.backupPath = config.backup.path;
  }

  async createBackup(options = {}) {
    const { includeImages = true, includePublic = false, includeConfig = true } = options;
    const backupId = `backup-${Date.now()}`;
    const backupDir = path.join(this.backupPath, backupId);

    const result = {
      id: backupId,
      timestamp: new Date(),
      type: 'full',
      components: {},
      totalSize: 0,
      errors: [],
    };

    try {
      await fs.mkdir(backupDir, { recursive: true });

      await query(
        `INSERT INTO backup_records (backup_id, type, status) VALUES ($1, 'manual', 'pending')`,
        [backupId]
      );

      console.log(`[Backup] Starting backup: ${backupId}`);

      const dbPath = await this.backupDatabase(backupDir);
      result.components.database = { path: dbPath, size: await this.getFileSize(dbPath) };

      if (includeImages) {
        const imagesPath = await this.backupImages(backupDir);
        if (imagesPath) {
          result.components.images = { path: imagesPath, size: await this.getFileSize(imagesPath) };
        }
      }

      if (includePublic) {
        const publicPath = await this.backupPublic(backupDir);
        if (publicPath) {
          result.components.public = { path: publicPath, size: await this.getFileSize(publicPath) };
        }
      }

      if (includeConfig) {
        await this.backupConfig(backupDir);
      }

      await this.createManifest(backupDir, result);

      result.totalSize = Object.values(result.components).reduce((sum, c) => sum + (c.size || 0), 0);

      await query(
        `UPDATE backup_records SET status = 'success', database_path = $1, images_path = $2, size_bytes = $3, completed_at = CURRENT_TIMESTAMP WHERE backup_id = $4`,
        [dbPath, result.components.images?.path, result.totalSize, backupId]
      );

      console.log(`[Backup] Completed: ${backupId}, Size: ${this.formatSize(result.totalSize)}`);

      return result;
    } catch (error) {
      result.errors.push(error.message);
      await query(
        `UPDATE backup_records SET status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP WHERE backup_id = $2`,
        [error.message, backupId]
      );
      throw error;
    }
  }

  async backupDatabase(backupDir) {
    const dbPath = path.join(backupDir, 'database.sql');
    const dbUrl = config.database.url;

    try {
      await execAsync(`pg_dump "${dbUrl}" > "${dbPath}"`);
      return dbPath;
    } catch (error) {
      console.error('[Backup] Database backup failed:', error);
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  async backupImages(backupDir) {
    const imagesPath = path.join(backupDir, 'images.tar.gz');
    const imagesDir = path.join(config.public.path, 'images', 'manuals');

    try {
      await fs.access(imagesDir);
      await execAsync(`tar -czf "${imagesPath}" -C "${path.dirname(imagesDir)}" manuals`);
      return imagesPath;
    } catch (error) {
      console.log('[Backup] No images to backup');
      return null;
    }
  }

  async backupPublic(backupDir) {
    const publicPath = path.join(backupDir, 'public.tar.gz');
    const publicDir = config.public.path;

    try {
      await execAsync(`tar -czf "${publicPath}" -C "${publicDir}" .`);
      return publicPath;
    } catch (error) {
      console.log('[Backup] No public files to backup');
      return null;
    }
  }

  async backupConfig(backupDir) {
    const configPath = path.join(backupDir, 'config.json');
    const configData = {
      timestamp: new Date().toISOString(),
      nodeEnv: config.nodeEnv,
      siteName: config.public.siteName,
      siteUrl: config.public.siteUrl,
    };
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
  }

  async createManifest(backupDir, result) {
    const manifestPath = path.join(backupDir, 'manifest.json');
    const manifest = {
      version: '1.0',
      id: result.id,
      timestamp: result.timestamp.toISOString(),
      type: result.type,
      components: result.components,
      totalSize: result.totalSize,
    };
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  async listBackups() {
    const result = await query(
      `SELECT * FROM backup_records ORDER BY started_at DESC`
    );
    return result.rows;
  }

  async cleanupOldBackups(retentionCount = config.backup.retentionCount) {
    const backups = await this.listBackups();
    
    if (backups.length <= retentionCount) {
      return { deleted: 0 };
    }

    const toDelete = backups.slice(retentionCount);
    let deleted = 0;

    for (const backup of toDelete) {
      try {
        const backupDir = path.join(this.backupPath, backup.backup_id);
        await fs.rm(backupDir, { recursive: true, force: true });
        await query('DELETE FROM backup_records WHERE backup_id = $1', [backup.backup_id]);
        deleted++;
      } catch (error) {
        console.error(`[Backup] Failed to delete ${backup.backup_id}:`, error);
      }
    }

    return { deleted };
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
}

export default BackupManager;
