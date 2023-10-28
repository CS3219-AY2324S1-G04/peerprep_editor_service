/**
 * @file Setup for yjs websocket.
 */
import cookie from 'cookie'
import { Request } from 'express';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import { getRoom, getUserRoomInfo } from '../service/room_service';
import UserConnection from './user_connection';
import { IncomingMessage } from 'http';

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

    try {
      const roomId = this._parseUrlForRoomId(req.url);
      const room = await getRoom(this._apiConfig.roomServiceApi, roomId);

      if (room == null) {
        throw new Error(`Room does not exist! ${roomId}`);
      }

      const doc = await this._docsManager.getDoc(roomId);

      if (doc == null) {
        throw new Error(`Unable to get doc! ${roomId}`);
      }

      new UserConnection(conn, doc, this._onDocDeleted);
    } catch (error) {
      console.log('Unable to upgrade connection!', error);
      conn.close();
    }
  };

  public getUpgradeHandler =
    (wss: WebSocket.Server) =>
    async (request: IncomingMessage, socket: Duplex, head: Buffer) => {

      // Check room status.
      try {
        if (!request.headers?.cookie) {
          throw new Error('Not authorized');
        }
        const sessionToken = cookie.parse(request.headers.cookie)[
          'session-token'
        ];

        if (!sessionToken) {
          throw new Error('Not authorized');
        }

        if (!request.url) {
          throw new Error('Invalid url!');
        }

        const roomId = this._parseUrlForRoomId(request.url);

        const room = await getUserRoomInfo(
          this._apiConfig.roomServiceApi,
          sessionToken,
        );

        if (!room || room.roomId !== roomId) {
          throw new Error('Room not found!');
        }

        await this._docsManager.getDoc(roomId);

        const handleAuth = (client: WebSocket) => {
          console.log('handle auth');
          wss.emit('connection', client, request);
        };

        wss.handleUpgrade(request, socket, head, handleAuth);
      } catch (error) {
        console.log('Reject connection', request.url, error);
        socket.destroy();
      }
    };

  private _onDocDeleted(roomId: string) {
    this._docsManager.removeDoc(roomId);
  }

  private _parseUrlForRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}

export default RoomConnectionSocketHandler;
