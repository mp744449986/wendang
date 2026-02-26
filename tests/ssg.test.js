import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('SSG Template Tests', () => {
  it('should have valid homepage template structure', async () => {
    const fs = await import('fs/promises');
    const template = await fs.readFile('./src/generator/templates/homepage.html', 'utf-8');
    
    assert.ok(template.includes('<!DOCTYPE html>'));
    assert.ok(template.includes('<%= siteName %>'));
    assert.ok(template.includes('manuals'));
  });

  it('should have valid page template structure', async () => {
    const fs = await import('fs/promises');
    const template = await fs.readFile('./src/generator/templates/page.html', 'utf-8');
    
    assert.ok(template.includes('<!DOCTYPE html>'));
    assert.ok(template.includes('<%= manual.title %>'));
    assert.ok(template.includes('<%= page.number %>'));
    assert.ok(template.includes('pagination'));
  });

  it('should have valid brand list template structure', async () => {
    const fs = await import('fs/promises');
    const template = await fs.readFile('./src/generator/templates/brand-list.html', 'utf-8');
    
    assert.ok(template.includes('<!DOCTYPE html>'));
    assert.ok(template.includes('<%= brand %>'));
  });
});

describe('Public Assets Tests', () => {
  it('should have search.js file', async () => {
    const fs = await import('fs/promises');
    const searchJs = await fs.readFile('./public/js/search.js', 'utf-8');
    
    assert.ok(searchJs.includes('FrontendSearch'));
    assert.ok(searchJs.includes('init'));
    assert.ok(searchJs.includes('search'));
  });
});

describe('Database Init Script Tests', () => {
  it('should have valid SQL init script', async () => {
    const fs = await import('fs/promises');
    const initSql = await fs.readFile('./init.sql', 'utf-8');
    
    assert.ok(initSql.includes('CREATE TABLE'));
    assert.ok(initSql.includes('manuals'));
    assert.ok(initSql.includes('pages'));
    assert.ok(initSql.includes('ad_slots'));
    assert.ok(initSql.includes('admin_sessions'));
  });
});
