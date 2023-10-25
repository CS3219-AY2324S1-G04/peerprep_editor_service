/**
 * @file Entry point for the editor api service.
 */
import express from 'express';
import expressWs from 'express-ws';
import http from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import EditorApiConfig from './configs/editor_api_config';
import DocsManager from './docs_manager';
import ConnectionSetupHandler from './handlers/connection_setup_handler';
import { getRoom } from './service/room_service';

export default class App {
  private _expressApp: expressWs.Application;
  private _wss: WebSocket.Server;
  private _apiConfig: EditorApiConfig;
  private _docsManager: DocsManager;

  public constructor(apiConfig: EditorApiConfig) {
    this._expressApp = expressWs(express()).app;
    this._wss = new WebSocket.Server({ noServer: true });
    this._apiConfig = apiConfig;
    this._docsManager = new DocsManager(apiConfig);
  }

  /**
   * Starts the server.
   */
  public start(): void {
    const connectionHandler = new ConnectionSetupHandler(
      this._apiConfig,
      this._docsManager,
    );

    // TODO: Use route for socket.

    this._wss.on('connection', connectionHandler.getHandler());

    const httpServer = http.createServer();

    httpServer.on('upgrade', this._handleUpgrade);
    httpServer.listen(this._apiConfig.port, () => {
      console.log(`running on port ${this._apiConfig.port}`);
    });
  }

  private _handleUpgrade = async (
    request: http.IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
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
      this._wss.emit('connection', client, request);
    };

    this._wss.handleUpgrade(request, socket, head, handleAuth);
  };

  private _getRoomId(url: string) {
    return url.slice(1).split('?')[0];
  }
}
