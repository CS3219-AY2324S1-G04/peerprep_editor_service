/**
 * @file Utils for yjs websocket.
 */
import WebSocket from 'ws';
import { LeveldbPersistence } from 'y-leveldb';
import awarenessProtocol from 'y-protocols/awareness';

import WSSharedDoc from './ws_shared_doc';

export const wsReadyStateConnecting = 0;
export const wsReadyStateOpen = 1;
export const wsReadyStateClosing = 2 // eslint-disable-line
export const wsReadyStateClosed = 3 // eslint-disable-line

export const messageSync = 0;
export const messageAwareness = 1;

export type Persistence = {
  bindState: (str: string, wssDoc: WSSharedDoc) => void;
  writeState: (str: string, wssDoc: WSSharedDoc) => Promise<object | void>;
  provider: LeveldbPersistence;
} | null;

export const send = (
  docs: Map<string, WSSharedDoc>,
  doc: WSSharedDoc,
  conn: WebSocket,
  m: Uint8Array,
  persistence?: Persistence,
) => {
  if (
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    closeConn(docs, doc, conn);
  }
  try {
    conn.send(m, (err) => {
      err != null && closeConn(docs, doc, conn, persistence);
    });
  } catch (e) {
    closeConn(docs, doc, conn);
  }
};

export const closeConn = (
  docs: Map<string, WSSharedDoc>,
  doc: WSSharedDoc,
  conn: WebSocket,
  persistence?: Persistence,
) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);

    doc.conns.delete(conn);

    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds != null ? controlledIds : []),
      null,
    );

    if (doc.conns.size === 0 && persistence != null) {
      // if persisted, we store state and destroy ydocument
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });
      docs.delete(doc.name);
    }
  }
  conn.close();
};
