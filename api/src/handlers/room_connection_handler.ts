/**
 * @file Setup for yjs websocket.
 */
import { Request } from 'express';
import WebSocket from 'ws';

import DocsManager from '../docs_manager';
import ConnectionHandler from './connection_handler';

export default class RoomConnectionHandler extends ConnectionHandler {
  private _docsManager: DocsManager;

  public constructor(docsManager: DocsManager) {
    super();
    this._docsManager = docsManager;
  }

  public override get handle() {
    return (conn: WebSocket, req: Request) => {
      this._setupConnection(conn, req);
    };
  }

  private async _setupConnection(conn: WebSocket, req: Request) {
    try {
      const roomId = this._parseUrlForRoomId(req.url);
      const doc = this._docsManager.getDoc(roomId);

      if (doc == null) {
        throw new Error(`Unable to get doc! ${roomId}`);
      }

      doc.registerConn(conn);
    } catch (error) {
      console.log('Unable to setup connection!', error);
      conn.close();
    }
  }

  private _parseUrlForRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}
