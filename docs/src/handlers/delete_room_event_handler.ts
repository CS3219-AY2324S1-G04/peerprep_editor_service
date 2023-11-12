/**
 * @file Defines {@link DeleteRoomEventHandler}.
 */
import { RedisPersistence } from 'y-redis';

import RedisClient from '../services/redis_client';
import { EventType, RoomEvent } from '../services/room_service_mq_consumer';
import RoomEventHandler from './room_event_handler';

const DOCS_SET_KEY = 'docs';
const DELETE_CHANNEL = 'delete';

export default class DeleteRoomEventHandler extends RoomEventHandler {
  private _redisClient: RedisClient;
  private _persistence: RedisPersistence;

  public constructor(redisClient: RedisClient, persistence: RedisPersistence) {
    super();
    this._redisClient = redisClient;
    this._persistence = persistence;
  }

  public override get eventType(): EventType {
    return EventType.delete;
  }

  public override get handle(): (roomEvent: RoomEvent) => Promise<void> {
    return async (roomEvent: RoomEvent) => {
      console.log('On delete room', roomEvent);
      const room = roomEvent.room;

      await this._persistence.clearDocument(room.roomId);

      const redis = this._redisClient.createInstance();

      await redis.srem(DOCS_SET_KEY, room.roomId);
      await redis.publish(`${room.roomId}:${DELETE_CHANNEL}`, room.roomId);
    };
  }
}
