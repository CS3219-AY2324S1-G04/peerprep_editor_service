/**
 * @file Upgrade handler for room..
 */
import cookie from 'cookie';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import AccessTokenVerifier from '../service/access_token_verifier';
import { getRoom, getUserRoomInfo } from '../service/room_service';
import UpgradeHandler from './upgrade_handler';

export default class RoomUpgradeHandler extends UpgradeHandler {
  private _docsManager: DocsManager;
  private _apiConfig: EditorApiConfig;
  private _wss: WebSocket.Server;
  private _accessTokenVerifier: AccessTokenVerifier;

  public constructor(
    editorApiConfig: EditorApiConfig,
    docsManager: DocsManager,
    wss: WebSocket.Server,
    accessTokenVerifier: AccessTokenVerifier,
  ) {
    super();
    this._apiConfig = editorApiConfig;
    this._docsManager = docsManager;
    this._wss = wss;
    this._accessTokenVerifier = accessTokenVerifier;
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

      if (!request.url) {
        throw new Error('Invalid url');
      }

      const accessToken = cookie.parse(request.headers.cookie)['access-token'];
      const userProfile = this._accessTokenVerifier.verify(accessToken);

      if (!userProfile) {
        throw new Error();
      }

      const roomId = this._parseUrlForRoomId(request.url);
      const room = await getRoom(this._apiConfig.roomServiceApi, roomId);

      if (!room || !room.userIds.includes(userProfile.userId)) {
        throw new Error('Room not found!');
      }

      if (!this._docsManager.hasDoc(roomId)) {
        await this._docsManager.setupDoc(roomId);
      }

      const handleAuth = (client: WebSocket) => {
        console.log('handle auth');
        this._wss.emit('connection', client, request);
      };

      this._wss.handleUpgrade(request, socket, head, handleAuth);
    } catch (error) {
      console.error('Reject connection', request.url, error);
      socket.destroy();
    }
  }

  private _parseUrlForRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}
