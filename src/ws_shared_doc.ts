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
import syncProtocol from 'y-protocols/sync';
import Y from 'yjs';

import { callbackHandler, isCallbackSet } from './callback';
import { send } from './utils';

const messageSync = 0;
const messageAwareness = 1;

const CALLBACK_DEBOUNCE_WAIT = process.env.CALLBACK_DEBOUNCE_WAIT
  ? parseInt(process.env.CALLBACK_DEBOUNCE_WAIT)
  : 2000;

const CALLBACK_DEBOUNCE_MAXWAIT = process.env.CALLBACK_DEBOUNCE_MAXWAIT
  ? parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT)
  : 10000;

export default class WSSharedDoc extends Y.Doc {
  /**
   * Maps from conn to set of controlled user ids.
   * Delete all user ids from awareness when this conn is closed.
   */
  private _docs: Map<string, WSSharedDoc>;
  private _name: string;
  private _conns: Map<WebSocket, Set<number>>;
  private _awareness: Awareness;

  public constructor(
    name: string,
    gcEnabled: boolean,
    docs: Map<string, WSSharedDoc>,
  ) {
    super({ gc: gcEnabled });

    this._name = name;
    this._docs = docs;
    this._conns = new Map();
    this._awareness = new Awareness(this);
    this._awareness.setLocalState(null);

    interface AwarenessUpdate {
      added: number[];
      updated: number[];
      removed: number[];
    }

    const awarenessChangeHandler = (
      { added, updated, removed }: AwarenessUpdate,
      conn: WebSocket,
    ) => {
      const changedClients = added.concat(updated, removed);

      if (conn !== null) {
        const connControlledIDs = this._conns.get(conn);

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

      this._conns.forEach((_, c) => {
        send(this._docs, this, c, buff);
      });
    };

    const updateHandler = (
      update: Uint8Array,
      origin: unknown,
      doc: WSSharedDoc,
    ) => {
      const encoder = createEncoder();

      writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);

      const message = toUint8Array(encoder);

      doc.conns.forEach((_: Set<number>, conn: WebSocket) =>
        send(this._docs, doc, conn, message),
      );
    };

    this._awareness.on('update', awarenessChangeHandler);

    this.on('update', updateHandler);

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
    return this._conns;
  }

  public get awareness() {
    return this._awareness;
  }

  public get name() {
    return this._name;
  }
}
