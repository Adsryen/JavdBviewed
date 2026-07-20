/**
 * @file extensionIdentity.ts
 * @description Chromium 固定扩展 ID：从 key.pem / SPKI 公钥计算扩展 ID，并在 2.0.0+ 注入 manifest.key
 * @module scripts
 */
import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface FixedExtensionIdentity {
  fixedExtensionId: string;
  manifestKey: string;
  source?: string;
  sinceVersion?: string;
  notes?: string;
}

export interface ManifestWithOptionalKey {
  key?: string;
  version?: string;
  [key: string]: unknown;
}

const CHROME_ID_ALPHABET = 'abcdefghijklmnop';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_IDENTITY_PATH = path.resolve(__dirname, 'extension-identity.json');
export const DEFAULT_KEY_PEM_PATH = path.resolve(__dirname, '..', 'key.pem');

/** Chromium: SHA-256(SPKI DER) 前 16 字节 → a-p 字母表 32 字符扩展 ID */
export function computeExtensionIdFromPublicKeyDer(publicKeyDer: Buffer | Uint8Array): string {
  const hash = createHash('sha256').update(publicKeyDer).digest();
  let id = '';
  for (let i = 0; i < 16; i += 1) {
    const byte = hash[i];
    id += CHROME_ID_ALPHABET[byte >> 4];
    id += CHROME_ID_ALPHABET[byte & 0x0f];
  }
  return id;
}

/** 从 PEM 私钥或公钥提取 SPKI DER 与 base64 公钥（manifest.key 格式） */
export function extractPublicKeyFromPem(pem: string): { publicKeyDer: Buffer; manifestKey: string; extensionId: string } {
  const trimmed = pem.trim();
  if (!trimmed) {
    throw new Error('PEM content is empty');
  }

  let publicKey;
  if (trimmed.includes('PRIVATE KEY')) {
    const privateKey = createPrivateKey(trimmed);
    publicKey = createPublicKey(privateKey);
  } else {
    publicKey = createPublicKey(trimmed);
  }

  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const manifestKey = publicKeyDer.toString('base64');
  const extensionId = computeExtensionIdFromPublicKeyDer(publicKeyDer);
  return { publicKeyDer, manifestKey, extensionId };
}

/** 从 base64 SPKI 公钥计算扩展 ID */
export function computeExtensionIdFromManifestKey(manifestKey: string): string {
  const publicKeyDer = Buffer.from(manifestKey, 'base64');
  return computeExtensionIdFromPublicKeyDer(publicKeyDer);
}

export function parseMajorVersion(version: string | null | undefined): number | null {
  if (!version || typeof version !== 'string') return null;
  const match = version.trim().match(/^(\d+)/);
  if (!match) return null;
  const major = Number(match[1]);
  return Number.isFinite(major) ? major : null;
}

/** 仅 major >= 2 注入固定 manifest.key；1.x 必须保持无 key */
export function shouldInjectManifestKey(version: string | null | undefined): boolean {
  const major = parseMajorVersion(version);
  return major !== null && major >= 2;
}

export function loadFixedExtensionIdentity(identityPath: string = DEFAULT_IDENTITY_PATH): FixedExtensionIdentity {
  const raw = fs.readFileSync(identityPath, 'utf8');
  const identity = JSON.parse(raw) as FixedExtensionIdentity;
  if (!identity?.fixedExtensionId || !identity?.manifestKey) {
    throw new Error(`Invalid extension identity file: ${identityPath}`);
  }

  const computedId = computeExtensionIdFromManifestKey(identity.manifestKey);
  if (computedId !== identity.fixedExtensionId) {
    throw new Error(
      `Locked extension identity mismatch: file says ${identity.fixedExtensionId}, but manifestKey computes to ${computedId}`,
    );
  }

  return identity;
}

export function verifyKeyPemMatchesIdentity(
  pemPath: string,
  identity: FixedExtensionIdentity,
): { ok: true; extensionId: string } | { ok: false; reason: string } {
  if (!fs.existsSync(pemPath)) {
    return { ok: false, reason: `key.pem not found: ${pemPath}` };
  }

  try {
    const pem = fs.readFileSync(pemPath, 'utf8');
    const extracted = extractPublicKeyFromPem(pem);

    if (extracted.manifestKey !== identity.manifestKey) {
      return {
        ok: false,
        reason: 'key.pem public key does not match locked extension-identity.json manifestKey',
      };
    }

    if (extracted.extensionId !== identity.fixedExtensionId) {
      return {
        ok: false,
        reason: `key.pem computes extension ID ${extracted.extensionId}, expected ${identity.fixedExtensionId}`,
      };
    }

    return { ok: true, extensionId: extracted.extensionId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `failed to read/parse key.pem: ${message}` };
  }
}

/**
 * 按版本决定是否写入固定 manifest.key。
 * - 1.x：强制删除 key（即使源 manifest 误带了）
 * - 2.0.0+：注入锁定公钥，并校验 ID
 */
export function applyFixedExtensionIdentity<T extends ManifestWithOptionalKey>(
  manifest: T,
  options: {
    version?: string | null;
    identity?: FixedExtensionIdentity;
    identityPath?: string;
    keyPemPath?: string;
    requireKeyPem?: boolean;
  } = {},
): T {
  const version = options.version ?? manifest.version ?? null;
  const next = { ...manifest };

  if (!shouldInjectManifestKey(version)) {
    delete next.key;
    return next;
  }

  const identity = options.identity ?? loadFixedExtensionIdentity(options.identityPath);
  const keyPemPath = options.keyPemPath ?? DEFAULT_KEY_PEM_PATH;

  if (options.requireKeyPem || fs.existsSync(keyPemPath)) {
    const verified = verifyKeyPemMatchesIdentity(keyPemPath, identity);
    if (!verified.ok) {
      throw new Error(`[extensionIdentity] ${verified.reason}`);
    }
  }

  const computedId = computeExtensionIdFromManifestKey(identity.manifestKey);
  if (computedId !== identity.fixedExtensionId) {
    throw new Error(
      `[extensionIdentity] locked identity is corrupt: ${identity.fixedExtensionId} != ${computedId}`,
    );
  }

  next.key = identity.manifestKey;
  return next;
}

/** 构建后校验 dist/manifest.json 的 key 门禁 */
export function assertManifestKeyGate(
  manifest: ManifestWithOptionalKey,
  options: {
    version?: string | null;
    identity?: FixedExtensionIdentity;
    identityPath?: string;
  } = {},
): void {
  const version = options.version ?? manifest.version ?? null;
  const inject = shouldInjectManifestKey(version);

  if (!inject) {
    if (Object.prototype.hasOwnProperty.call(manifest, 'key') && manifest.key != null) {
      throw new Error(`[extensionIdentity] 1.x build must not contain manifest.key (version=${version})`);
    }
    return;
  }

  if (!manifest.key) {
    throw new Error(`[extensionIdentity] 2.0.0+ build requires manifest.key (version=${version})`);
  }

  const identity = options.identity ?? loadFixedExtensionIdentity(options.identityPath);
  if (manifest.key !== identity.manifestKey) {
    throw new Error('[extensionIdentity] dist manifest.key does not match locked identity');
  }

  const computedId = computeExtensionIdFromManifestKey(manifest.key);
  if (computedId !== identity.fixedExtensionId) {
    throw new Error(
      `[extensionIdentity] dist key computes ID ${computedId}, expected ${identity.fixedExtensionId}`,
    );
  }
}
