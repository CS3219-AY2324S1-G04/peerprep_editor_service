/**
 * @file Entry point for the editor api service.
 */
import express from 'express';
import WebSocket from 'ws';

import EditorApiConfig from './configs/editor_api_config';
import DocsManager from './docs_manager';
import RoomConnectionSocketHandler from './handlers/room_connect_socket_handler';

export default class App {
  private _apiConfig: EditorApiConfig;
  private _express;
  private _wss: WebSocket.Server;
  private _docsManager: DocsManager;

  public constructor(apiConfig: EditorApiConfig) {
    this._express = express();
    this._wss = new WebSocket.Server({
      noServer: true,
    });
    this._apiConfig = apiConfig;
    this._docsManager = new DocsManager(apiConfig);
  }

  /**
   * Starts the server.
   */
  public start(): void {
    const connectionHandler = new RoomConnectionSocketHandler(
      this._apiConfig,
      this._docsManager,
    );

    // TODO: Use route for socket.

    this._wss.on('connection', connectionHandler.getHandler());

    const server = this._express.listen(this._apiConfig.port, () => {
      console.log('Running on port', this._apiConfig.port);
    });

    server.on('upgrade', connectionHandler.getUpgradeHandler(this._wss));
  }
}
