/**
 * @file Utils for yjs websocket.
 */
import { LeveldbPersistence } from 'y-leveldb';

import WSSharedDoc from './ws_shared_doc';

export type Persistence = {
  bindState: (str: string, wssDoc: WSSharedDoc) => void;
  writeState: (str: string, wssDoc: WSSharedDoc) => Promise<object | void>;
  provider: LeveldbPersistence;
} | null;
