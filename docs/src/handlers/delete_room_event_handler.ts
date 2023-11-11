import { Redis } from 'ioredis';
import { RedisPersistence } from 'y-redis';

import EditorDocsConfig from '../configs/editor_docs_config';
import { EventType, RoomEvent } from '../services/room_service_mq_consumer';
import RoomEventHandler from './room_event_handler';

const DELETE_CHANNEL = 'delete';

export default class DeleteRoomEventHandler extends RoomEventHandler {
  private _persistence: RedisPersistence;
  private _editorDocsConfig: EditorDocsConfig;

  public constructor(
    editorDocsConfig: EditorDocsConfig,
    persistence: RedisPersistence,
  ) {
    super();
    this._editorDocsConfig = editorDocsConfig;
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

      new Redis().publish(`${room.roomId}:${DELETE_CHANNEL}`, room.roomId);
    };
  }
}
