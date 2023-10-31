/**
 * @file Upgrade handler for room..
 */
import cookie from 'cookie';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import { getUserRoomInfo } from '../service/room_service';
import UpgradeHandler from './upgrade_handler';

export default class RoomUpgradeHandler extends UpgradeHandler {
  private _docsManager: DocsManager;
  private _apiConfig: EditorApiConfig;
  private _wss: WebSocket.Server;

  public constructor(
    editorApiConfig: EditorApiConfig,
    docsManager: DocsManager,
    wss: WebSocket.Server,
  ) {
    super();
    this._apiConfig = editorApiConfig;
    this._docsManager = docsManager;
    this._wss = wss;
  }

  public override get upgrade() {
    return (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      this._upgradeConnection(request, socket, head);
    };
  }

  private async _upgradeConnection(
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) {
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
        this._wss.emit('connection', client, request);
      };

      this._wss.handleUpgrade(request, socket, head, handleAuth);
    } catch (error) {
      console.log('Reject connection', request.url, error);
      socket.destroy();
    }
  }

  private _parseUrlForRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}
