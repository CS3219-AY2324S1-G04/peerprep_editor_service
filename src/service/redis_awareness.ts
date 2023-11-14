/**
 * @file Defines {@link RedisAwareness}.
 */
import { Redis } from 'ioredis';
import awarenessProtocol, {
  Awareness,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';

import AwarenessUpdate from '../interfaces/awareness_update';
import RedisClient from './redis_client';

export default class RedisAwareness {
  private _roomId: string;
  private _redisSub: Redis;
  private _redisPub: Redis;
  private _awareness: Awareness;

  public constructor(
    redisClient: RedisClient,
    roomId: string,
    awareness: Awareness,
  ) {
    this._roomId = roomId;
    this._redisSub = redisClient.createInstance();
    this._redisPub = redisClient.createInstance();
    this._awareness = awareness;
  }

  public async connect() {
    this._awareness.on('update', this._publishAwarenessUpdate);

    await this._redisSub.subscribe(`${this._roomId}:awareness`);

    this._redisSub.on('messageBuffer', (_, data: Buffer) => {
      const message = data;
      awarenessProtocol.applyAwarenessUpdate(this._awareness, message, this);
    });
  }

  public async disconnect() {
    await this._redisSub.unsubscribe(`${this._roomId}:awareness`);
  }

  private _publishAwarenessUpdate = async (
    { added, updated, removed }: AwarenessUpdate,
    source: unknown,
  ) => {
    if (source instanceof RedisAwareness) {
      return;
    }
    const changedClients = added.concat(updated, removed);

    const encoded = encodeAwarenessUpdate(this._awareness, changedClients);
    const message = Buffer.from(encoded);
    await this._redisPub.publish(`${this._roomId}:awareness`, message);
  };
}
