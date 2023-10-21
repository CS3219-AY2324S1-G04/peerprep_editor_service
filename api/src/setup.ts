/**
 * @file Setup for yjs websocket.
 */
import { createDecoder, readVarUint, readVarUint8Array } from 'lib0/decoding';
import {
  createEncoder,
  length,
  toUint8Array,
  writeVarUint,
  writeVarUint8Array,
} from 'lib0/encoding';
import { setIfUndefined } from 'lib0/map';
import WebSocket from 'ws';
import { LeveldbPersistence } from 'y-leveldb';
import awarenessProtocol from 'y-protocols/awareness';
import syncProtocol from 'y-protocols/sync';
import Y from 'yjs';

import {
  Persistence,
  closeConn,
  messageAwareness,
  messageSync,
  send,
} from './utils';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';
const persistenceDir = process.env.YPERSISTENCE;

let persistence: Persistence = null;

// Initialise levelDb for persistence.
if (typeof persistenceDir === 'string') {
  console.info('Persisting documents to "' + persistenceDir + '"');
  const ldb = new LeveldbPersistence(persistenceDir);

  persistence = {
    provider: ldb,

    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);

      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

      ydoc.on('update', (update: Uint8Array) => {
        ldb.storeUpdate(docName, update);
      });
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    writeState: async (docName: string, ydoc: WSSharedDoc) => {},
  };
}

exports.getPersistence = () => persistence;

const docs: Map<string, WSSharedDoc> = new Map();

// Exporting docs so that others can use it
exports.docs = docs;

// const messageAuth = 2

const getYDoc = (docname: string, gc = true) => {
  return setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname, gcEnabled, docs);
    doc.gc = gc;
    if (persistence !== null) {
      persistence.bindState(docname, doc);
    }
    docs.set(docname, doc);
    return doc;
  });
};

exports.getYDoc = getYDoc;

const messageListener = (
  conn: WebSocket,
  doc: WSSharedDoc,
  message: Uint8Array,
) => {
  try {
    const encoder = createEncoder();
    const decoder = createDecoder(message);
    const messageType = readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (length(encoder) > 1) {
          send(docs, doc, conn, toUint8Array(encoder));
        }
        break;

      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          readVarUint8Array(decoder),
          conn,
        );
        break;
      }
    }
  } catch (err) {
    console.error(err);
    doc.emit('error', [err]);
  }
};

const pingTimeout = 30000;

export const setupWSConnection = (
  conn: WebSocket,
  req: Request,
  { docName = req.url.slice(1).split('?')[0], gc = true } = {},
) => {
  conn.binaryType = 'arraybuffer';
  // get doc, initialize if it does not exist yet
  const doc = getYDoc(docName, gc);
  doc.conns.set(conn, new Set());

  // listen and reply to events
  conn.on('message', (message: Uint8Array) => {
    return messageListener(conn, doc, new Uint8Array(message));
  });

  // Check if connection is still alive
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(docs, doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(docs, doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on('close', () => {
    closeConn(docs, doc, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  // eslint-disable-next-line max-len
  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = createEncoder();
    writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);

    send(docs, doc, conn, toUint8Array(encoder));

    const awarenessStates = doc.awareness.getStates();

    if (awarenessStates.size > 0) {
      const encoder = createEncoder();
      writeVarUint(encoder, messageAwareness);
      writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys()),
        ),
      );
      send(docs, doc, conn, toUint8Array(encoder));
    }
  }
};
