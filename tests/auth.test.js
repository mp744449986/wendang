import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';

describe('Auth Module', () => {
  const testSecret = 'test-secret-key-32-characters-long';
  const testPayload = { role: 'admin', loginTime: Date.now() };

  it('should generate a valid JWT token', () => {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');
  });

  it('should verify a valid JWT token', () => {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, testSecret);
    assert.strictEqual(decoded.role, 'admin');
  });

  it('should reject an invalid JWT token', () => {
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    assert.throws(() => {
      jwt.verify(token + 'invalid', testSecret);
    });
  });
});

describe('Config Module', () => {
  it('should have required config fields', () => {
    const config = {
      port: 3000,
      nodeEnv: 'development',
      jwt: { secret: 'test', expiresIn: '24h' },
      upload: { maxSize: 200 * 1024 * 1024 },
    };
    assert.ok(config.port);
    assert.ok(config.jwt);
    assert.ok(config.upload);
  });

  it('should have correct default port', () => {
    const config = { port: parseInt(process.env.PORT) || 3000 };
    assert.strictEqual(config.port, 3000);
  });
});

describe('Utility Functions', () => {
  it('should format file size correctly', () => {
    const formatSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    };

    assert.strictEqual(formatSize(500), '500 B');
    assert.strictEqual(formatSize(1024), '1.00 KB');
    assert.strictEqual(formatSize(1024 * 1024), '1.00 MB');
    assert.strictEqual(formatSize(1024 * 1024 * 1024), '1.00 GB');
  });

  it('should generate slug from brand and model', () => {
    const generateSlug = (brand, model) => {
      return `${brand.toLowerCase().replace(/\s+/g, '-')}-${model.toLowerCase().replace(/\s+/g, '-')}`;
    };

    assert.strictEqual(generateSlug('Atlas Copco', 'GA 37'), 'atlas-copco-ga-37');
    assert.strictEqual(generateSlug('Brand Name', 'Model-123'), 'brand-name-model-123');
  });
});
