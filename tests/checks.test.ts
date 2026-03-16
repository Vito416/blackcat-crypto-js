import { describe, expect, it } from 'vitest';

import { runChecks } from '../src/checks.js';
import { loadCryptoConfig } from '../src/config.js';
import { createConfigFixture } from './helpers.js';

describe('runChecks', () => {
  it('returns pass for healthy config', () => {
    const { configPath } = createConfigFixture();
    const config = loadCryptoConfig({ configPath });
    const suite = runChecks(config);
    expect(suite.passed).toBe(true);
    expect(suite.results).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'encryption.key', status: 'pass' })]));
  });

  it('detects missing contexts and slots', () => {
    const { configPath } = createConfigFixture({
      envelope: { defaultContext: 'pii', allowedContexts: [] },
      keys: { encryptionKey: 'short', hmacSlots: {} },
    });
    const config = loadCryptoConfig({ configPath });
    const suite = runChecks(config);
    const failing = suite.results.filter((result) => result.status === 'fail');
    expect(failing.length).toBeGreaterThanOrEqual(2);
  });
});
