import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadCryptoConfig } from '../src/config.js';
import { createConfigFixture } from './helpers.js';

describe('loadCryptoConfig', () => {
  it('loads config from custom path and resolves placeholders', () => {
    const { configPath, dir } = createConfigFixture({
      keys: {
        encryptionKeyFile: path.join(dir, 'encryption.key'),
        hmacSlots: {
          api: '${env:API_SLOT_SECRET}',
        },
      },
    });

    const config = loadCryptoConfig({
      configPath,
      env: {
        API_SLOT_SECRET: 'secret-from-env',
      },
    });

    expect(config.configPath).toBe(configPath);
    expect(config.defaultContext).toBe('pii');
    expect(config.hmacSlots.api).toBe('secret-from-env');
    expect(config.encryptionKey.length).toBeGreaterThanOrEqual(32);
  });

  it('honors telemetry fallbacks', () => {
    const { configPath, dir } = createConfigFixture({
      telemetry: {
        eventsFile: path.join(dir, 'logs', 'events.ndjson'),
        metricsFile: path.join(dir, 'metrics', 'metrics.prom'),
      },
    });

    const config = loadCryptoConfig({ configPath });
    expect(config.telemetry.eventsFile).toContain(path.join(dir, 'logs', 'events.ndjson'));
    expect(config.telemetry.metricsFile).toContain(path.join(dir, 'metrics', 'metrics.prom'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
