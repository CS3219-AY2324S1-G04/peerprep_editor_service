/**
 * @file Defines {@link RedisDocsService}.
 */
import RedisClient from './redis_client';

const DOCS_KEY = 'docs';
const DELETE_CHANNEL = 'delete';

export default class RedisDocsService {
  private _redisClient: RedisClient;

  public constructor(redisClient: RedisClient) {
    this._redisClient = redisClient;
  }

  public async registerRoomDeletion(
    roomId: string,
    onDelete: () => Promise<void>,
  ) {
    const redis = this._redisClient.createInstance();
    const channel = `${roomId}:${DELETE_CHANNEL}`;

    await redis.subscribe(channel);
    redis.on('message', async (_, roomId) => {
      console.log('Receive delete room msg', roomId);
      await onDelete();
      await redis.unsubscribe(channel);
    });
  }

  public async isDocCreated(roomId: string) {
    const redis = this._redisClient.createInstance();
    const status: number = await redis.sismember(DOCS_KEY, roomId);
    redis.quit();
    return status == 1;
  }
}
