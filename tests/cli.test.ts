import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/cli.js';
import { createConfigFixture } from './helpers.js';

function captureIO() {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    io: {
      log: (message: string) => logs.push(message),
      error: (message: string) => errors.push(message),
    },
    logs,
    errors,
  };
}

describe('CLI', () => {
  it('renders config summary', async () => {
    const { configPath } = createConfigFixture();
    const { io, logs } = captureIO();
    const exitCode = await runCli(['config:show', '--config', configPath, '--json'], io);
    expect(exitCode).toBe(0);
    expect(JSON.parse(logs[0]).configPath).toBe(configPath);
  });

  it('runs workflows in dry-run mode by default', async () => {
    const { configPath } = createConfigFixture();
    const { io, logs } = captureIO();
    const exitCode = await runCli(['workflows:run', 'encrypt', '--config', configPath, '--json'], io);
    expect(exitCode).toBe(0);
    const payload = JSON.parse(logs[0]);
    expect(payload.dryRun).toBe(true);
    expect(payload.workflow.id).toBe('encrypt');
  });

  it('syncs hmac slots from manifest', async () => {
    const { configPath, dir } = createConfigFixture();
    const manifestPath = `${dir}/manifest.json`;
    const outputPath = `${dir}/hmac.json`;
    const manifest = {
      slots: {
        'core.hmac.email': { type: 'hmac', key: 'email_key' },
        'core.vault': { type: 'aead', key: 'filevault_key' },
      },
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const { io, logs } = captureIO();
    const exitCode = await runCli(['slots:sync', '--manifest', manifestPath, '--output', outputPath, '--config', configPath], io);
    expect(exitCode).toBe(0);
    const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(generated.hmacSlots['core.hmac.email']).toEqual({ type: 'hmac', context: 'core.hmac.email' });
    expect(logs[0]).toContain('exported');
  });
});
