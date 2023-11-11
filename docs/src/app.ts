/**
 * @file Entry point for the editor docs service.
 */
import RoomServiceMq from './services/room_service_mq';

export default class App {
  private _roomServiceMq: RoomServiceMq;

  public constructor(roomServiceMq: RoomServiceMq) {
    this._roomServiceMq = roomServiceMq;
  }

  /**
   * Starts the server.
   */
  public async start(): Promise<void> {
    try {
      await this._roomServiceMq.connect();
    } catch (error) {
      console.error('Failed to initialize editor docs service!', error);
    }
  }
}
