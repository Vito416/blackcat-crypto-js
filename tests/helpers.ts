import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function createConfigFixture(overrides: Record<string, unknown> = {}): { configPath: string; dir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackcat-crypto-js-'));
  const keySource = Buffer.from('fixture-key-012345678901234567890123456789012345').toString('base64url');
  const keyFile = path.join(dir, 'encryption.key');
  fs.writeFileSync(keyFile, keySource, 'utf8');

  const fakeIntegration = path.join(dir, 'blackcat-crypto.bin');
  fs.writeFileSync(fakeIntegration, '#!/bin/sh\necho fake');
  fs.chmodSync(fakeIntegration, 0o755);

  const config = {
    envelope: {
      defaultContext: 'pii',
      allowedContexts: ['pii', 'session'],
      metadata: { owner: 'tests' },
    },
    keys: {
      encryptionKeyFile: keyFile,
      hmacSlots: {
        api: 'slot-secret',
        session: 'session-secret',
      },
    },
    telemetry: {
      eventsFile: path.join(dir, 'telemetry.ndjson'),
      metricsFile: path.join(dir, 'metrics.prom'),
    },
    integrations: {
      'blackcat-crypto': fakeIntegration,
    },
    workflows: [
      { id: 'encrypt', type: 'encryption', payload: 'hello' },
      { id: 'sign', type: 'signature', slot: 'api', payload: 'payload' },
    ],
    security: {
      requiredIntegrations: ['blackcat-crypto'],
      requireContexts: ['pii'],
    },
    ...overrides,
  };

  const configPath = path.join(dir, 'crypto.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return { configPath, dir };
}
