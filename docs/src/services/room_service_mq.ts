/**
 * @file Room service mq.
 */
import RoomEventHandler from '../handlers/room_event_handler';
import RoomServiceMqConsumer, {
  RoomEvent,
  RoomServiceMqConsumerConfig,
} from './room_service_mq_consumer';

export default class RoomServiceMq {
  private _consumer: RoomServiceMqConsumer;
  private _handlers: Record<string, RoomEventHandler[]>;

  public constructor(
    config: RoomServiceMqConsumerConfig,
    handlers: RoomEventHandler[],
  ) {
    this._consumer = new RoomServiceMqConsumer(config);

    this._handlers = {};

    handlers.forEach((handler) => {
      if (!this._handlers[handler.eventType]) {
        this._handlers[handler.eventType] = [];
      }

      this._handlers[handler.eventType].push(handler);
    });
  }

  public async connect() {
    await this._consumer.initialise();
    await this._consumer.consume(async (roomEvent: RoomEvent) => {
      if (this._handlers[roomEvent.eventType]) {
        this._handlers[roomEvent.eventType].forEach((handler) =>
          handler.handle(roomEvent),
        );
      }
    });
  }
}
