import BackupManager from './manager.js';
import config from '../config/index.js';

const run = async () => {
  const manager = new BackupManager();
  
  try {
    console.log('Starting backup...');
    const result = await manager.createBackup({
      includeImages: true,
      includePublic: true,
      includeConfig: true,
    });
    
    console.log('Backup completed successfully!');
    console.log(`ID: ${result.id}`);
    console.log(`Size: ${manager.formatSize(result.totalSize)}`);
    
    console.log('\nCleaning up old backups...');
    const cleanup = await manager.cleanupOldBackups();
    console.log(`Deleted ${cleanup.deleted} old backups`);
    
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
};

run();
