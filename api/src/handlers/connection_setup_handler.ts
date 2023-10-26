/**
 * @file Setup for yjs websocket.
 */
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import { getRoom } from '../service/room_service';
import UserConnection from './user_connection';

class ConnectionSetupHandler {
  private _docsManager: DocsManager;
  private _editorApiConfig: EditorApiConfig;

  public constructor(
    editorApiConfig: EditorApiConfig,
    docsManager: DocsManager,
  ) {
    this._editorApiConfig = editorApiConfig;
    this._docsManager = docsManager;
  }

  public getHandler = () => async (conn: WebSocket, req: Request) => {
    conn.binaryType = 'arraybuffer';

    const roomId = this._getRoomId(req.url);
    const room = await getRoom(this._editorApiConfig.roomServiceApi, roomId);

    if (room == null) {
      conn.close();
      return;
    }

    const doc = await this._docsManager.getDoc(roomId);

    if (doc == null) {
      conn.close();
      return;
    }

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
