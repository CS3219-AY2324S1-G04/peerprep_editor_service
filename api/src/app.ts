/**
 * @file Entry point for the editor api service.
 */
import express from 'express';
import WebSocket from 'ws';

import EditorApiConfig from './configs/editor_api_config';
import ConnectionHandler from './handlers/connection_handler';
import UpgradeHandler from './handlers/upgrade_handler';

const HTTP_UPGRADE_EVENT = 'upgrade';
const WSS_CONNECTION_EVENT = 'connection';

export default class App {
  private _apiConfig: EditorApiConfig;
  private _express;
  private _connectionHandler: ConnectionHandler;
  private _upgradeHandler: UpgradeHandler;

  public constructor(
    apiConfig: EditorApiConfig,
    connectionHandler: ConnectionHandler,
    upgradeHandler: UpgradeHandler,
  ) {
    // Use express for rest calls between client and editor service.
    this._express = express();
    this._apiConfig = apiConfig;
    this._connectionHandler = connectionHandler;
    this._upgradeHandler = upgradeHandler;
  }

  /**
   * Starts the server.
   */
  public async start(): Promise<void> {
    const server = this._express.listen(this._apiConfig.port, () => {
      console.log('Running on', this._apiConfig.port);
    });

    const route = this._apiConfig.serviceRoute + '/room';
    const wss = new WebSocket.Server({
      noServer: true,
      path: route,
    });

    server.on(HTTP_UPGRADE_EVENT, this._upgradeHandler.getHandler(wss));
    wss.on(WSS_CONNECTION_EVENT, this._connectionHandler.handle);
  }
}
