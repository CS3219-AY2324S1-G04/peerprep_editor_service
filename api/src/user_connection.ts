/**
 * @file Represents a user connection.
 */
import WebSocket from 'ws';
import awarenessProtocol from 'y-protocols/awareness';

import { Persistence } from './utils';
import WSSharedDoc from './ws_shared_doc';

export const wsReadyStateConnecting = 0;
export const wsReadyStateOpen = 1;
export const wsReadyStateClosing = 2 // eslint-disable-line
export const wsReadyStateClosed = 3 // eslint-disable-line

export default class UserConnection {
  private _conn: WebSocket;
  private _doc: WSSharedDoc;

  private _onDocDeleted: (roomId: string) => void;

  public constructor(
    conn: WebSocket,
    doc: WSSharedDoc,
    onDocDeleted: (roomId: string) => void,
  ) {
    this._conn = conn;
    this._doc = doc;
    this._onDocDeleted = onDocDeleted;
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
        // if persisted, we store state and destroy ydocument
        persistence.writeState(this._doc.roomId, this._doc).then(() => {
          this._doc.destroy();
        });

        this._onDocDeleted(this._doc.roomId);
      }
    }
    this._conn.close();
  }
}
