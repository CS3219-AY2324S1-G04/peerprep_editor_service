import RedisClient from './redis_client';

const DOCS_KEY = 'docs';
const DELETE_CHANNEL = 'delete';

export default class RedisDocsService {
  private _redisClient: RedisClient;

  public constructor(redisClient: RedisClient) {
    this._redisClient = redisClient;
  }

  public subscribeToRoomDeletion(roomId: string, onDelete: () => void) {
    const redis = this._redisClient.createInstance();
    const channel = `$${roomId}:${DELETE_CHANNEL}`;

    redis.subscribe(channel);
    redis.on('message', () => {
      onDelete();
      redis.unsubscribe(channel);
    });
  }

  public async isDocCreated(roomId: string) {
    const redis = this._redisClient.createInstance();
    const status: number = await redis.sismember(DOCS_KEY, roomId);
    return status == 1;
  }
}
