/**
 * @file Entry point for the editor api service.
 */
import express from 'express';
import WebSocket from 'ws';

import EditorApiConfig from './configs/editor_api_config';
import DocsManager from './docs_manager';
import RoomConnectionHandler from './handlers/room_connection_handler';
import RoomUpgradeHandler from './handlers/room_upgrade_handler';
import AccessTokenVerifier from './service/access_token_verifier';
import { getAccessTokenPublicKey } from './service/user_service';

const HTTP_UPGRADE_EVENT = 'upgrade';
const WSS_CONNECTION_EVENT = 'connection';

export default class App {
  private _apiConfig: EditorApiConfig;
  private _express;
  private _docsManager: DocsManager;

  public constructor(apiConfig: EditorApiConfig) {
    this._express = express();
    this._apiConfig = apiConfig;
    this._docsManager = new DocsManager(apiConfig);
  }

  /**
   * Starts the server.
   */
  public async start(): Promise<void> {
    const accessTokenVerifier: AccessTokenVerifier = new AccessTokenVerifier(
      await getAccessTokenPublicKey(this._apiConfig.userServiceApi),
    );

    const server = this._express.listen(this._apiConfig.port, () => {
      console.log('Running on', this._apiConfig.port);
    });

    const route = this._apiConfig.serviceRoute + '/room';
    const wss = new WebSocket.Server({
      noServer: true,
      path: route,
    });

    const connectionHandler = new RoomConnectionHandler(
      this._apiConfig,
      this._docsManager,
    );

    const upgradeHandler = new RoomUpgradeHandler(
      this._apiConfig,
      this._docsManager,
      wss,
      accessTokenVerifier,
    );

    server.on(HTTP_UPGRADE_EVENT, upgradeHandler.upgrade);
    wss.on(WSS_CONNECTION_EVENT, connectionHandler.handle);
  }
}
