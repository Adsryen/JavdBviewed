import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  applyFixedExtensionIdentity,
  assertManifestKeyGate,
  computeExtensionIdFromManifestKey,
  extractPublicKeyFromPem,
  loadFixedExtensionIdentity,
  shouldInjectManifestKey,
  verifyKeyPemMatchesIdentity,
} from './extensionIdentity';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const identityPath = path.resolve(__dirname, 'extension-identity.json');
const keyPemPath = path.resolve(__dirname, '..', 'key.pem');

describe('extensionIdentity', () => {
  it('loads locked identity and recomputes the same extension ID from manifestKey', () => {
    const identity = loadFixedExtensionIdentity(identityPath);
    expect(identity.fixedExtensionId).toBe('gnegjfjccmeafanpmbjboegcbchcghka');
    expect(computeExtensionIdFromManifestKey(identity.manifestKey)).toBe(identity.fixedExtensionId);
  });

  it('only injects manifest.key for major >= 2', () => {
    expect(shouldInjectManifestKey('1.21.5')).toBe(false);
    expect(shouldInjectManifestKey('1.99.0')).toBe(false);
    expect(shouldInjectManifestKey('2.0.0')).toBe(true);
    expect(shouldInjectManifestKey('2.1.3')).toBe(true);
    expect(shouldInjectManifestKey('10.0.0')).toBe(true);
  });

  it('strips key on 1.x even if source manifest accidentally has one', () => {
    const identity = loadFixedExtensionIdentity(identityPath);
    const result = applyFixedExtensionIdentity(
      { version: '1.21.5', name: 'test', key: identity.manifestKey },
      { identity },
    );
    expect(result).not.toHaveProperty('key');
    expect(result.version).toBe('1.21.5');
  });

  it('injects locked key on 2.0.0+', () => {
    const identity = loadFixedExtensionIdentity(identityPath);
    const result = applyFixedExtensionIdentity(
      { version: '2.0.0', name: 'test' },
      { identity, requireKeyPem: false },
    );
    expect(result.key).toBe(identity.manifestKey);
    expect(computeExtensionIdFromManifestKey(result.key!)).toBe(identity.fixedExtensionId);
  });

  it('assertManifestKeyGate enforces absence on 1.x and presence on 2.x', () => {
    const identity = loadFixedExtensionIdentity(identityPath);

    expect(() => assertManifestKeyGate({ version: '1.21.5' }, { identity })).not.toThrow();
    expect(() =>
      assertManifestKeyGate({ version: '1.21.5', key: identity.manifestKey }, { identity }),
    ).toThrow(/must not contain manifest\.key/);

    expect(() => assertManifestKeyGate({ version: '2.0.0' }, { identity })).toThrow(/requires manifest\.key/);
    expect(() =>
      assertManifestKeyGate({ version: '2.0.0', key: identity.manifestKey }, { identity }),
    ).not.toThrow();
  });

  it('verifies local key.pem against locked identity when present', () => {
    if (!fs.existsSync(keyPemPath)) {
      // CI / clean checkout may not have the private key; public identity still ships.
      return;
    }

    const identity = loadFixedExtensionIdentity(identityPath);
    const verified = verifyKeyPemMatchesIdentity(keyPemPath, identity);
    expect(verified.ok).toBe(true);

    const pem = fs.readFileSync(keyPemPath, 'utf8');
    const extracted = extractPublicKeyFromPem(pem);
    expect(extracted.extensionId).toBe(identity.fixedExtensionId);
    expect(extracted.manifestKey).toBe(identity.manifestKey);
  });

  it('rejects a mismatched or invalid key.pem without throwing', () => {
    const identity = loadFixedExtensionIdentity(identityPath);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ext-id-'));
    const badPemPath = path.join(tmpDir, 'key.pem');
    fs.writeFileSync(badPemPath, 'not-a-pem', 'utf8');
    const result = verifyKeyPemMatchesIdentity(badPemPath, identity);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/failed to read\/parse key\.pem|does not match/);
    }
  });
});
