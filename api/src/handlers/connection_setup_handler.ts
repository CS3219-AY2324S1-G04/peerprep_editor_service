/**
 * @file Setup for yjs websocket.
 */
import WebSocket from 'ws';

import DocsManager from '../docs_manager';
import RoomModel from '../models/room_model';
import RoomService from '../service/room_service';
import UserConnection from './user_connection';

class ConnectionSetupHandler {
  private _docsManager: DocsManager;

  public constructor(docsManager: DocsManager) {
    this._docsManager = docsManager;
  }

  public getHandler = () => async (conn: WebSocket, req: Request) => {
    conn.binaryType = 'arraybuffer';

    const roomId = this._getRoomId(req.url);
    const room: RoomModel | null = await new RoomService().getRoomInfo(roomId);

    if (room == null) {
      conn.close();
    }

    const doc = this._docsManager.getDoc(roomId);
    new UserConnection(conn, doc, this._onDocDeleted);
  };

  private _onDocDeleted(roomId: string) {
    this._docsManager.removeDoc(roomId);
  }

  private _getRoomId(url: string) {
    return url.slice(1).split('?')[0];
  }
}

export default ConnectionSetupHandler;
