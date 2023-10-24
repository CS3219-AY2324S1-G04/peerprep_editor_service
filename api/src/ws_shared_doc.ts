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
import { Awareness, encodeAwarenessUpdate } from 'y-protocols/awareness';
import syncProtocol from 'y-protocols/sync';
import Y from 'yjs';

import { callbackHandler, isCallbackSet } from './callback';
import UserConnection from './handlers/user_connection';

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
  private _connections: Map<UserConnection, Set<number>>;
  private _awareness: Awareness;

  public constructor(roomId: string, gcEnabled: boolean, data?: string) {
    super({ gc: gcEnabled });

    if (data != null) {
      this.getText().insert(0, data);
    }

    this._roomId = roomId;
    this._connections = new Map();
    this._awareness = new Awareness(this);
    this._awareness.setLocalState(null);

    interface AwarenessUpdate {
      added: number[];
      updated: number[];
      removed: number[];
    }

    const onAwarenessUpdate = (
      { added, updated, removed }: AwarenessUpdate,
      userConn: UserConnection,
    ) => {
      const changedClients = added.concat(updated, removed);

      if (userConn !== null) {
        const connControlledIDs = this._connections.get(userConn);

        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => {
            connControlledIDs.add(clientID);
          });

          removed.forEach((clientID) => {
            connControlledIDs.delete(clientID);
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

      this._connections.forEach((_, conn) => {
        conn.send(buff);
      });
    };

    const onUpdate = (
      update: Uint8Array,
      origin: unknown,
      doc: WSSharedDoc,
    ) => {
      const encoder = createEncoder();

      writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);

      const message = toUint8Array(encoder);

      // Broadcast update.
      doc.conns.forEach((_: Set<number>, conn: UserConnection) =>
        conn.send(message),
      );
    };

    this._awareness.on('update', onAwarenessUpdate);

    this.on('update', onUpdate);

    if (isCallbackSet) {
      this.on(
        'update',
        debounce(callbackHandler, CALLBACK_DEBOUNCE_WAIT, {
          maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
        }),
      );
    }
  }

  public get conns() {
    return this._connections;
  }

  public get awareness() {
    return this._awareness;
  }

  public get roomId() {
    return this._roomId;
  }
}
