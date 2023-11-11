/**
 * @file Manages a user connection.
 */
import { createDecoder, readVarUint } from 'lib0/decoding';
import {
  createEncoder,
  toUint8Array,
  writeVarUint,
  writeVarUint8Array,
} from 'lib0/encoding';
import WebSocket from 'ws';
import awarenessProtocol, { Awareness } from 'y-protocols/awareness';
import syncProtocol from 'y-protocols/sync';
import Y from 'yjs';

import { MessageType } from './enums/message_type';
import SocketMessageHandler from './handlers/socket_handlers/socket_message_handler';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line
const pingTimeout = 30000;

export default class UserConnection {
  private _socket: WebSocket;
  private _heartbeat: NodeJS.Timeout;
  private _onClose: () => void;
  private _messageHandlers: SocketMessageHandler[] = [];

  public constructor(socket: WebSocket, onClose: () => void) {
    console.log('\n Add new conn');

    this._socket = socket;
    this._onClose = onClose;

    socket.binaryType = 'arraybuffer';

    this._registerHandlers();
    this._heartbeat = this._startHeartbeat();
  }

  public addMessageHandlers(handlers: SocketMessageHandler[]) {
    handlers.forEach((handler) => {
      this._messageHandlers[handler.messageType] = handler;
    });
  }

  public send(m: Uint8Array) {
    if (
      this._socket.readyState !== wsReadyStateConnecting &&
      this._socket.readyState !== wsReadyStateOpen
    ) {
      this.close();
    }

    try {
      this._socket.send(m, (err) => {
        err != null && this.close();
      });
    } catch (e) {
      this.close();
    }
  }

  public close() {
    console.log('Close connection');
    clearInterval(this._heartbeat);
    this._socket.close();

    this._onClose();
  }

  public sendSyncStep1(yDoc: Y.Doc) {
    const encoder = createEncoder();
    writeVarUint(encoder, MessageType.messageSync);

    console.log('Send sync step 1');

    syncProtocol.writeSyncStep1(encoder, yDoc);

    this.send(toUint8Array(encoder));
  }

  public sendAwareness(awareness: Awareness) {
    const awarenessStates = awareness.getStates();

    if (awarenessStates.size > 0) {
      const encoder = createEncoder();
      writeVarUint(encoder, MessageType.messageAwareness);
      writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          awareness,
          Array.from(awarenessStates.keys()),
        ),
      );
      this.send(toUint8Array(encoder));
    }
  }

  private _registerHandlers() {
    console.log('register handlers');
    this._socket.on('message', (data: ArrayBuffer) => {
      const message = new Uint8Array(data);
      const decoder = createDecoder(message);

      const messageType: MessageType = readVarUint(decoder);

      if (messageType in this._messageHandlers) {
        this._messageHandlers[messageType].handle(decoder);
      }
    });

    this._socket.on('close', () => {
      this.close();
      clearInterval(this._heartbeat);
    });
  }

  private _startHeartbeat() {
    let pongReceived = true;

    this._socket.on('pong', () => {
      pongReceived = true;
    });

    // Check if connection is still alive
    return setInterval(() => {
      if (!pongReceived) {
        this.close();
      } else {
        pongReceived = false;

        try {
          this._socket.ping();
        } catch (e) {
          this.close();
        }
      }
    }, pingTimeout);
  }
}
