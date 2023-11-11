/**
 * @file Handles syncing of updates from client.
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
import { RedisPersistence } from 'y-redis';
import Y from 'yjs';

import { callbackHandler, isCallbackSet } from './callback';
import AwarenessMessageHandler from './handlers/socket_handlers/awareness_message_handler';
import SyncMessageHandler from './handlers/socket_handlers/sync_message_handler';
import AwarenessUpdate from './interfaces/awareness_update';
import RedisAwareness from './service/redis_awareness';
import UserConnection from './user_connection';

const messageSync = 0;
const messageAwareness = 1;

const CALLBACK_DEBOUNCE_WAIT = process.env.CALLBACK_DEBOUNCE_WAIT
  ? parseInt(process.env.CALLBACK_DEBOUNCE_WAIT)
  : 2000;

const CALLBACK_DEBOUNCE_MAXWAIT = process.env.CALLBACK_DEBOUNCE_MAXWAIT
  ? parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT)
  : 10000;

export default class WSSharedDoc extends Y.Doc {
  private _roomId: string;
  private _conns: Map<UserConnection, Set<number>>;
  private _awareness: Awareness;
  private _persistence: RedisPersistence | undefined;
  private _redisAwareness: RedisAwareness | undefined;

  public constructor(
    roomId: string,
    gcEnabled: boolean,
    data?: string,
    persistence?: RedisPersistence,
  ) {
    super({ gc: gcEnabled });

    this._roomId = roomId;
    this._conns = new Map();
    this._awareness = new Awareness(this);

    this._awareness.on('update', this._onAwarenessUpdate);
    this._awareness.setLocalState(null);

    this.on('update', this._broadcastUpdate);

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

    if (persistence) {
      this._persistence = persistence;
      this._persistence.bindState(roomId, this);
      this._redisAwareness = new RedisAwareness(roomId, this._awareness);
      this._redisAwareness.connect();
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

  public override destroy() {
    super.destroy();

    this._conns.forEach((_, conn) => {
      conn.close();
    });

    this._awareness.destroy();
    this._persistence?.clearDocument(this._roomId);
  }

  private _onConnectionClose(conn: UserConnection) {
    const awarenessIds = this._conns.get(conn);

    this._conns.delete(conn);

    awarenessProtocol.removeAwarenessStates(
      this._awareness,
      Array.from(awarenessIds != null ? awarenessIds : []),
      null,
    );

    if (this._conns.size === 0) {
      console.log('No more connections!', this._roomId);
    }
  }

  private _onAwarenessUpdate = (
    { added, updated, removed }: AwarenessUpdate,
    originUserConn: UserConnection,
  ) => {
    const changedClients = added.concat(updated, removed);

    if (originUserConn !== null) {
      const awarenessIds = this._conns.get(originUserConn);

      if (awarenessIds !== undefined) {
        added.forEach((clientID) => {
          awarenessIds.add(clientID);
        });

        removed.forEach((clientID) => {
          awarenessIds.delete(clientID);
        });
      }
    }

    this._broadcastAwarenessUpdate(changedClients);
  };

  private _broadcastUpdate = (update: Uint8Array) => {
    const encoder = createEncoder();

    writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = toUint8Array(encoder);

    this.broadcastMessage(message);
  };

  private _broadcastAwarenessUpdate(changedClients: number[]) {
    const encoder = createEncoder();
    writeVarUint(encoder, messageAwareness);
    writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(this._awareness, changedClients),
    );

    const buff = toUint8Array(encoder);
    this.broadcastMessage(buff);
  }
}
