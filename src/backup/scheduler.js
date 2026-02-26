import cron from 'node-cron';
import BackupManager from './manager.js';

export class BackupScheduler {
  constructor() {
    this.manager = new BackupManager();
    this.scheduledTask = null;
  }

  start(schedule = '0 3 * * 0') {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }

    this.scheduledTask = cron.schedule(schedule, async () => {
      console.log('[BackupScheduler] Starting scheduled backup...');
      try {
        const result = await this.manager.createBackup({
          includeImages: true,
          includePublic: true,
          includeConfig: true,
        });
        console.log(`[BackupScheduler] Backup completed: ${result.id}`);

        const cleanup = await this.manager.cleanupOldBackups();
        if (cleanup.deleted > 0) {
          console.log(`[BackupScheduler] Cleaned up ${cleanup.deleted} old backups`);
        }
      } catch (error) {
        console.error('[BackupScheduler] Backup failed:', error);
      }
    });

    console.log(`[BackupScheduler] Scheduled backup started: ${schedule}`);
  }

  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      console.log('[BackupScheduler] Scheduled backup stopped');
    }
  }
}

export default BackupScheduler;
