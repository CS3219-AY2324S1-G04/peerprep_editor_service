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
import WebSocket from 'ws';
import awarenessProtocol from 'y-protocols/awareness';
import syncProtocol from 'y-protocols/sync';

import DocsManager from './docs_manager';
import { MessageType } from './enums/message_type';
import UserConnection from './user_connection';
import WSSharedDoc from './ws_shared_doc';

const pingTimeout = 30000;

export default class ConnectionHandler {
  private _docsManager: DocsManager;

  public constructor() {
    this._docsManager = new DocsManager();
  }

  public handle = (conn: WebSocket, req: Request) => {
    this._setupWSConnection(conn, req);
  };

  private _getRoom(url: string) {
    return url.slice(1).split('?')[0];
  }

  private _setupWSConnection(conn: WebSocket, req: Request) {
    conn.binaryType = 'arraybuffer';

    const room = this._getRoom(req.url);
    const gc = true;
    const doc = this._docsManager.getDoc(room, gc);

    const userConn = new UserConnection(conn, doc, this._onDocDeleted);
    doc.conns.set(userConn, new Set());

    let pongReceived = true;

    // listen and reply to events
    conn.on('message', (message: Uint8Array) => {
      this._handleMessage(userConn, doc, new Uint8Array(message));
    });

    conn.on('close', () => {
      userConn.close();
      clearInterval(pingInterval);
    });

    conn.on('pong', () => {
      pongReceived = true;
    });

    // Check if connection is still alive
    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        if (doc.conns.has(userConn)) {
          userConn.close();
        }

        clearInterval(pingInterval);
      } else if (doc.conns.has(userConn)) {
        pongReceived = false;

        try {
          conn.ping();
        } catch (e) {
          userConn.close();
          clearInterval(pingInterval);
        }
      }
    }, pingTimeout);

    // eslint-disable-next-line max-len
    // put the following in a variables in a block so the interval handlers don't keep in in
    // scope
    {
      // Send sync step 1
      const encoder = createEncoder();
      writeVarUint(encoder, MessageType.messageSync);
      syncProtocol.writeSyncStep1(encoder, doc);

      userConn.send(toUint8Array(encoder));

      // Update awareness
      const awarenessStates = doc.awareness.getStates();

      if (awarenessStates.size > 0) {
        const encoder = createEncoder();
        writeVarUint(encoder, MessageType.messageAwareness);
        writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            doc.awareness,
            Array.from(awarenessStates.keys()),
          ),
        );
        userConn.send(toUint8Array(encoder));
      }
    }
  }

  private _onDocDeleted(roomId: string) {
    this._docsManager.removeDoc(roomId);
  }

  private _handleMessage(
    userConn: UserConnection,
    doc: WSSharedDoc,
    message: Uint8Array,
  ) {
    try {
      const encoder = createEncoder();
      const decoder = createDecoder(message);
      const messageType = readVarUint(decoder);

      switch (messageType) {
        case MessageType.messageSync:
          writeVarUint(encoder, MessageType.messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, doc, userConn);

          // If the `encoder` only contains the type of reply message and no
          // message, there is no need to send the message. When `encoder` only
          // contains the type of reply, its length is 1.
          if (length(encoder) > 1) {
            userConn.send(toUint8Array(encoder));
          }
          break;

        case MessageType.messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            doc.awareness,
            readVarUint8Array(decoder),
            userConn,
          );
          break;
        }
      }
    } catch (err) {
      console.error(err);
      doc.emit('error', [err]);
    }
  }
}
