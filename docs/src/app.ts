/**
 * @file Entry point for the editor docs service.
 */
import cors from 'cors';
import express from 'express';

import EditorDocsConfig from './configs/editor_docs_config';
import RouteHandler, {
  HttpMethod,
} from './handlers/route_handlers/route_handler';
import RoomServiceMq from './services/room_service_mq';

export default class App {
  private _editorDocsConfig: EditorDocsConfig;
  private _expressApp: express.Application;
  private _roomServiceMq: RoomServiceMq;

  public constructor(
    editorDocsConfig: EditorDocsConfig,
    roomServiceMq: RoomServiceMq,
    handlers: RouteHandler[],
    isDevEnv: boolean,
  ) {
    this._editorDocsConfig = editorDocsConfig;
    this._roomServiceMq = roomServiceMq;
    this._expressApp = express();

    this._setupMiddlewares(isDevEnv);
    this._setupHandlers(handlers);
  }

  /**
   * Starts the server.
   */
  public async start(): Promise<void> {
    await this._roomServiceMq.connect();

    const port = this._editorDocsConfig.port;

    this._expressApp.listen(port, '0.0.0.0', () => {
      console.log(`Server listening to port ${port}`);
    });
  }

  private _setupMiddlewares(isDevEnv: boolean) {
    if (!isDevEnv) {
      return;
    }

    this._expressApp.use(
      cors({
        origin: new RegExp('http://localhost:[0-9]+'),
        credentials: true,
      }),
    );
  }

  private _setupHandlers(handlers: RouteHandler[]) {
    handlers.forEach((handler) => this._setupHandler(handler));
  }

  private _setupHandler(handler: RouteHandler) {
    const route = this._editorDocsConfig.docsServiceRoute + handler.route;

    switch (handler.method) {
      case HttpMethod.get:
        this._expressApp.get(route, handler.handle);
        break;
      case HttpMethod.post:
        this._expressApp.post(route, handler.handle);
        break;
      case HttpMethod.put:
        this._expressApp.put(route, handler.handle);
        break;
      case HttpMethod.delete:
        this._expressApp.delete(route, handler.handle);
        break;
    }
  }
}
