/**
 * @file Defines {@link RoomEventHandler}.
 */
import { EventType, RoomEvent } from '../services/room_service_mq_consumer';

export default abstract class RoomEventHandler {
  public abstract get eventType(): EventType;
  public abstract get handle(): (roomEvent: RoomEvent) => Promise<void>;
}
