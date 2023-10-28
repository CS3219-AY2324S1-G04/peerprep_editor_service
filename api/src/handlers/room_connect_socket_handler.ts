/**
 * @file Setup for yjs websocket.
 */
import http from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import { getRoom } from '../service/room_service';
import UserConnection from './user_connection';

class RoomConnectionSocketHandler {
  private _docsManager: DocsManager;
  private _apiConfig: EditorApiConfig;

  public constructor(
    editorApiConfig: EditorApiConfig,
    docsManager: DocsManager,
  ) {
    this._apiConfig = editorApiConfig;
    this._docsManager = docsManager;
  }

  public getHandler = () => async (conn: WebSocket, req: Request) => {
    console.log('connection');

    conn.binaryType = 'arraybuffer';

    const roomId = this._getRoomId(req.url);
    const room = await getRoom(this._apiConfig.roomServiceApi, roomId);

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

  public getUpgradeHandler =
    (wss: WebSocket.Server) =>
    async (request: http.IncomingMessage, socket: Duplex, head: Buffer) => {
      console.log('upgrade');
      // Check room status.

      if (!request.url) {
        console.log('reject', request.url);
        socket.destroy();
        return;
      }

      const roomId = this._getRoomId(request.url);

      const room = await getRoom(this._apiConfig.roomServiceApi, roomId);

      if (!room) {
        console.log('reject - room not found', roomId);
        socket.destroy();
        return;
      }

      await this._docsManager.getDoc(roomId);

      const handleAuth = (client: WebSocket) => {
        console.log('handle auth');
        wss.emit('connection', client, request);
      };

      wss.handleUpgrade(request, socket, head, handleAuth);
    };

  private _onDocDeleted(roomId: string) {
    this._docsManager.removeDoc(roomId);
  }

  private _getRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}

export default RoomConnectionSocketHandler;
