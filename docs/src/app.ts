/**
 * @file Entry point for the editor docs service.
 */
import { RedisPersistence } from 'y-redis';

import RoomServiceMq from './services/room_service_mq';

export default class App {
  private _persistence: RedisPersistence;
  private _roomServiceMq: RoomServiceMq;

  public constructor(
    persistence: RedisPersistence,
    roomServiceMq: RoomServiceMq,
  ) {
    this._persistence = persistence;
    this._roomServiceMq = roomServiceMq;
  }

  /**
   * Starts the server.
   */
  public async start(): Promise<void> {
    await this._roomServiceMq.connect();
  }
}
