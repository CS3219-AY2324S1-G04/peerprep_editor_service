/**
 * @file Upgrade handler for room..
 */
import cookie from 'cookie';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from '../configs/editor_api_config';
import DocsManager from '../docs_manager';
import AccessTokenVerifier, {
  UserProfile,
} from '../service/access_token_verifier';
import { getRoom } from '../service/room_service';
import UpgradeHandler from './upgrade_handler';

export default class RoomUpgradeHandler extends UpgradeHandler {
  private _docsManager: DocsManager;
  private _apiConfig: EditorApiConfig;
  private _accessTokenVerifier: AccessTokenVerifier;

  public constructor(
    editorApiConfig: EditorApiConfig,
    docsManager: DocsManager,
    accessTokenVerifier: AccessTokenVerifier,
  ) {
    super();
    this._apiConfig = editorApiConfig;
    this._docsManager = docsManager;
    this._accessTokenVerifier = accessTokenVerifier;
  }

  public override getHandler(
    wss: WebSocket.Server,
  ): (request: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void> {
    return async (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      // Check room status.
      try {
        const userProfile = this._authenticateReq(request);
        const roomId = await this._getUserRoomId(request, userProfile);

        await this._prepareRoomDoc(roomId);

        const handleAuth = (client: WebSocket) => {
          console.log('handle auth');
          wss.emit('connection', client, request);
        };

        wss.handleUpgrade(request, socket, head, handleAuth);
      } catch (error) {
        console.error('Reject connection', request.url);
        socket.destroy();
      }
    };
  }

  private async _prepareRoomDoc(roomId: string) {
    if (!this._docsManager.hasDoc(roomId)) {
      await this._docsManager.setupDoc(roomId);
    }
  }

  private _authenticateReq(request: IncomingMessage) {
    if (!request.headers?.cookie) {
      throw new Error('Invalid upgrade request');
    }

    const accessToken = cookie.parse(request.headers.cookie)['access-token'];
    const userProfile = this._accessTokenVerifier.verify(accessToken);

    if (!userProfile) {
      throw new Error();
    }

    return userProfile;
  }

  private async _getUserRoomId(
    request: IncomingMessage,
    userProfile: UserProfile,
  ) {
    if (!request.url) {
      throw new Error('Invalid request');
    }

    const roomId = this._parseUrlForRoomId(request.url);
    const room = await getRoom(this._apiConfig.roomServiceApi, roomId);

    if (!room || !room.userIds.includes(userProfile.userId)) {
      throw new Error('Invalid room!');
    }

    return roomId;
  }

  private _parseUrlForRoomId(url: string) {
    return url.slice(1).split('?')[1].split('=')[1];
  }
}
