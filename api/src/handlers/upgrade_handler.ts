/**
 * @file Handles socket upgrade.
 */
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

export default abstract class UpgradeHandler {
  public abstract get upgrade(): (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => void;
}
