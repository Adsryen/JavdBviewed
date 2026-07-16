/**
 * Desktop app skeleton — no product UI in Day-1 monorepo scaffold.
 */
import { PROTOCOL_VERSION } from '@javdb/sync-protocol';
import { createSyncClientStub } from '@javdb/sync-client';

export const productId = 'desktop' as const;
export const protocolVersion = PROTOCOL_VERSION;
export const sync = createSyncClientStub();
