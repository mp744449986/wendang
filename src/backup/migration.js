import fs from 'fs/promises';
import path from 'path';
import config from '../config/index.js';

export class MigrationTool {
  async exportForMigration(outputPath = '/tmp') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(outputPath, `migration-${timestamp}`);
    
    console.log('Starting migration export...');

    try {
      await fs.mkdir(exportDir, { recursive: true });

      console.log('Exporting database...');
      const { exec } = await import('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync(`pg_dump -Fc -Z9 -f ${exportDir}/database.dump "${config.database.url}"`);

      console.log('Archiving images...');
      const imagesDir = path.join(config.public.path, 'images');
      try {
        await fs.access(imagesDir);
        await execAsync(`tar -czf ${exportDir}/images.tar.gz -C ${imagesDir} .`);
      } catch {
        console.log('No images to export');
      }

      console.log('Archiving static pages...');
      await execAsync(`tar -czf ${exportDir}/public.tar.gz -C ${config.public.path} .`);

      console.log('Exporting configuration...');
      await fs.writeFile(
        path.join(exportDir, 'config.json'),
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          siteName: config.public.siteName,
          siteUrl: config.public.siteUrl,
        }, null, 2)
      );

      console.log('Creating import script...');
      await this.createImportScript(exportDir);

      console.log('Creating archive...');
      const archivePath = `${exportDir}.tar.gz`;
      await execAsync(`tar -czf ${archivePath} -C ${outputPath} migration-${timestamp}`);

      console.log(`Migration package created: ${archivePath}`);
      return archivePath;
    } catch (error) {
      console.error('Migration export failed:', error);
      throw error;
    }
  }

  async createImportScript(exportDir) {
    const script = `#!/bin/bash
# Migration Import Script
# Generated: ${new Date().toISOString()}

set -e

echo "=========================================="
echo "  Manual Viewer - Migration Import"
echo "=========================================="

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is required"
    exit 1
fi

echo "Restoring database..."
pg_restore -c -d "$DATABASE_URL" database.dump || true

echo "Restoring images..."
mkdir -p ./public/images/manuals
tar -xzf images.tar.gz -C ./public/images/manuals || true

echo "Restoring static pages..."
tar -xzf public.tar.gz -C ./public || true

echo ""
echo "Migration completed successfully!"
echo "Please restart the services and regenerate search index."
`;

    await fs.writeFile(path.join(exportDir, 'import.sh'), script, { mode: 0o755 });
  }
}

export default MigrationTool;
