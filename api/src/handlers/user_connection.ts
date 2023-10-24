/**
 * @file Manages a user connection.
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

import { MessageType } from '../enums/message_type';
import { Persistence } from '../utils';
import WSSharedDoc from '../ws_shared_doc';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line
const pingTimeout = 30000;

export default class UserConnection {
  private _conn: WebSocket;
  private _doc: WSSharedDoc;
  private _pingTimeout: NodeJS.Timeout;

  private _onDocDeleted: (roomId: string) => void;

  public constructor(
    conn: WebSocket,
    doc: WSSharedDoc,
    onDocDeleted: (roomId: string) => void,
  ) {
    this._conn = conn;
    this._doc = doc;
    this._onDocDeleted = onDocDeleted;

    doc.conns.set(this, new Set());

    conn.on('message', (message: Uint8Array) => {
      this._handleSync(new Uint8Array(message));
    });

    conn.on('close', () => {
      this.close();
      clearInterval(this._pingTimeout);
    });

    this._pingTimeout = this._startHeartbeat();
    this._sendSyncStep1();
    this._updateAwareness();
  }

  public send(m: Uint8Array) {
    if (
      this._conn.readyState !== wsReadyStateConnecting &&
      this._conn.readyState !== wsReadyStateOpen
    ) {
      this.close();
    }
    try {
      this._conn.send(m, (err) => {
        err != null && this.close();
      });
    } catch (e) {
      this.close();
    }
  }

  public close(persistence?: Persistence) {
    if (this._doc.conns.has(this)) {
      // Clean up conn.
      const controlledIds = this._doc.conns.get(this);

      this._doc.conns.delete(this);

      awarenessProtocol.removeAwarenessStates(
        this._doc.awareness,
        Array.from(controlledIds != null ? controlledIds : []),
        null,
      );

      // No more conns to doc.
      if (this._doc.conns.size === 0 && persistence != null) {
        // If persisted, we store state and destroy ydocument.
        persistence.writeState(this._doc.roomId, this._doc).then(() => {
          this._doc.destroy();
        });

        this._onDocDeleted(this._doc.roomId);
      }
    }
    this._conn.close();
  }

  private _handleSync(message: Uint8Array) {
    try {
      const encoder = createEncoder();
      const decoder = createDecoder(message);
      const messageType = readVarUint(decoder);

      switch (messageType) {
        case MessageType.messageSync:
          writeVarUint(encoder, MessageType.messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, this._doc, this);

          // If the `encoder` only contains the type of reply message and no
          // message, there is no need to send the message. When `encoder` only
          // contains the type of reply, its length is 1.
          if (length(encoder) > 1) {
            this.send(toUint8Array(encoder));
          }
          break;

        case MessageType.messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            this._doc.awareness,
            readVarUint8Array(decoder),
            this,
          );
          break;
        }
      }
    } catch (err) {
      console.error(err);
      this._doc.emit('error', [err]);
    }
  }

  private _startHeartbeat() {
    let pongReceived = true;

    this._conn.on('pong', () => {
      pongReceived = true;
    });

    // Check if connection is still alive
    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        if (this._doc.conns.has(this)) {
          this.close();
        }

        clearInterval(pingInterval);
      } else if (this._doc.conns.has(this)) {
        pongReceived = false;

        try {
          this._conn.ping();
        } catch (e) {
          this.close();
          clearInterval(pingInterval);
        }
      }
    }, pingTimeout);

    return pingInterval;
  }

  private _sendSyncStep1() {
    const encoder = createEncoder();
    writeVarUint(encoder, MessageType.messageSync);
    syncProtocol.writeSyncStep1(encoder, this._doc);

    this.send(toUint8Array(encoder));
  }

  private _updateAwareness() {
    const awarenessStates = this._doc.awareness.getStates();

    if (awarenessStates.size > 0) {
      const encoder = createEncoder();
      writeVarUint(encoder, MessageType.messageAwareness);
      writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          this._doc.awareness,
          Array.from(awarenessStates.keys()),
        ),
      );
      this.send(toUint8Array(encoder));
    }
  }
}
