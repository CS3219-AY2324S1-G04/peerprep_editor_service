/**
 * @file Handles socket upgrade.
 */
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

export default abstract class UpgradeHandler {
  public abstract getHandler(
    wss: WebSocket.Server,
  ): (request: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void>;
}
