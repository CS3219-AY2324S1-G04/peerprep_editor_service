/**
 * @file Entry point for the editor api service.
 */
import http from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from './configs/editor_api_config';
import DocsManager from './docs_manager';
import ConnectionSetupHandler from './handlers/connection_setup_handler';

export default class App {
  private _httpServer: http.Server;
  private _wss = new WebSocket.Server({ noServer: true });
  private _apiConfig = new EditorApiConfig();

  public constructor(
    httpServer: http.Server,
    wss: WebSocket.Server,
    apiConfig: EditorApiConfig,
  ) {
    this._httpServer = httpServer;
    this._wss = wss;
    this._apiConfig = apiConfig;
  }

  /**
   * Starts the server.
   */
  public start(): void {
    const connectionHandler = new ConnectionSetupHandler(new DocsManager());

    this._wss.on('connection', connectionHandler.getHandler());

    this._httpServer.on('upgrade', this._handleUpgrade);

    this._httpServer.listen(this._apiConfig.port, () => {
      console.log(`running on port ${this._apiConfig.port}`);
    });
  }

  private _handleUpgrade = (
    request: http.IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
    // Check room status.

    if (!request.url || !request.url.match(/^\/dev/)) {
      console.log('reject', request.url);
      socket.destroy();
      return;
    }

    const handleAuth = (client: WebSocket) => {
      this._wss.emit('connection', client, request);
    };

    this._wss.handleUpgrade(request, socket, head, handleAuth);
  };
}
