import { Redis } from 'ioredis';

const DOCS_KEY = 'docs';
const DELETE_CHANNEL = 'delete';

export default class DocsService {
  public subscribeToRoomDeletion(roomId: string, onDelete: () => void) {
    const redis = this._createRedisInstance();
    const channel = `$${roomId}:${DELETE_CHANNEL}`;

    redis.subscribe(channel);
    redis.on('message', () => {
      onDelete();
      redis.unsubscribe(channel);
    });
  }

  public async isDocCreated(roomId: string) {
    const redis = this._createRedisInstance();
    const status: number = await redis.sismember(DOCS_KEY, roomId);
    return status == 1;
  }

  private _createRedisInstance() {
    return new Redis();
  }
}
