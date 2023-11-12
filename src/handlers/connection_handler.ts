/**
 * @file Handles http connection .
 */
import { Request } from 'express';
import WebSocket from 'ws';

export default abstract class ConnectionHandler {
  public abstract get handle(): (conn: WebSocket, req: Request) => void;
}
