/**
 * @file Setup for yjs websocket.
 */
import { Request } from 'express';
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import { getRoom } from '../service/room_service';
import ConnectionHandler from './connection_handler';

export default class RoomConnectionHandler extends ConnectionHandler {
  private _docsManager: DocsManager;
  private _apiConfig: EditorApiConfig;

  public constructor(
    editorApiConfig: EditorApiConfig,
    docsManager: DocsManager,
  ) {
    super();
    this._apiConfig = editorApiConfig;
    this._docsManager = docsManager;
  }

  public override get handle() {
    return (conn: WebSocket, req: Request) => {
      this._setupConnection(conn, req);
    };
  }

  private async _setupConnection(conn: WebSocket, req: Request) {
    console.log('\n Setup connection');

    try {
      const roomId = this._parseUrlForRoomId(req.url);
      const doc = this._docsManager.getDoc(roomId);

      if (doc == null) {
        throw new Error(`Unable to get doc! ${roomId}`);
      }

      doc.registerConn(conn);
    } catch (error) {
      console.log('Unable to upgrade connection!', error);
      conn.close();
    }

    console.log('Setup connection complete');
  }

  private _parseUrlForRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}
