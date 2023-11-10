/**
 * @file Representation of shared doc using websocket.
 */
import {
  createEncoder,
  toUint8Array,
  writeVarUint,
  writeVarUint8Array,
} from 'lib0/encoding';
import debounce from 'lodash.debounce';
import WebSocket from 'ws';
import { Awareness, encodeAwarenessUpdate } from 'y-protocols/awareness';
import awarenessProtocol from 'y-protocols/awareness';
import syncProtocol from 'y-protocols/sync';
import Y from 'yjs';

import { callbackHandler, isCallbackSet } from './callback';
import AwarenessMessageHandler from './handlers/socket_handlers/awareness_message_handler';
import SyncMessageHandler from './handlers/socket_handlers/sync_message_handler';
import UserConnection from './user_connection';

const messageSync = 0;
const messageAwareness = 1;

const CALLBACK_DEBOUNCE_WAIT = process.env.CALLBACK_DEBOUNCE_WAIT
  ? parseInt(process.env.CALLBACK_DEBOUNCE_WAIT)
  : 2000;

const CALLBACK_DEBOUNCE_MAXWAIT = process.env.CALLBACK_DEBOUNCE_MAXWAIT
  ? parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT)
  : 10000;

interface AwarenessUpdate {
  added: number[];
  updated: number[];
  removed: number[];
}

export default class WSSharedDoc extends Y.Doc {
  private _roomId: string;
  private _conns: Map<UserConnection, Set<number>>;
  private _awareness: Awareness;

  public constructor(roomId: string, gcEnabled: boolean, data?: string) {
    super({ gc: gcEnabled });

    this._roomId = roomId;
    this._conns = new Map();
    this._awareness = new Awareness(this);

    this._awareness.on('update', this._onAwarenessUpdate);
    this.on('update', this._onDocUpdate);

    this._awareness.setLocalState(null);

    // Set initial doc text.
    if (data != null) {
      this.getText().insert(0, data);
    }

    if (isCallbackSet) {
      this.on(
        'update',
        debounce(callbackHandler, CALLBACK_DEBOUNCE_WAIT, {
          maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
        }),
      );
    }
  }

  public get roomId() {
    return this._roomId;
  }

  public registerConn(socket: WebSocket) {
    const newConn = new UserConnection(socket, () => {
      this._onConnectionClose(newConn);
    });

    newConn.addMessageHandlers([
      new SyncMessageHandler(this, newConn),
      new AwarenessMessageHandler(this._awareness, newConn),
    ]);

    newConn.sendSyncStep1(this);
    newConn.sendAwareness(this._awareness);

    this._conns.set(newConn, new Set());
  }

  public broadcastMessage(message: Uint8Array) {
    this._conns.forEach((_, conn) => conn.send(message));
  }

  private _onConnectionClose(conn: UserConnection) {
    const controlledIds = this._conns.get(conn);

    this._conns.delete(conn);

    awarenessProtocol.removeAwarenessStates(
      this._awareness,
      Array.from(controlledIds != null ? controlledIds : []),
      null,
    );

    // TODO: Handle persistence.
    if (this._conns.size === 0) {
      console.log('No more connections!', this._roomId);
    }
  }

  private _onAwarenessUpdate = (
    { added, updated, removed }: AwarenessUpdate,
    userConn: UserConnection,
  ) => {
    const changedClients = added.concat(updated, removed);

    if (userConn !== null) {
      const awarenessIds = this._conns.get(userConn);

      if (awarenessIds !== undefined) {
        added.forEach((clientID) => {
          awarenessIds.add(clientID);
        });

        removed.forEach((clientID) => {
          awarenessIds.delete(clientID);
        });
      }
    }

    // Broadcast awareness update
    const encoder = createEncoder();
    writeVarUint(encoder, messageAwareness);
    writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(this._awareness, changedClients),
    );

    const buff = toUint8Array(encoder);
    this.broadcastMessage(buff);
  };

  private _onDocUpdate = (
    update: Uint8Array,
    origin: unknown,
    doc: WSSharedDoc,
  ) => {
    const encoder = createEncoder();

    writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);

    const message = toUint8Array(encoder);

    // Broadcast update.
    doc.broadcastMessage(message);
  };
}
