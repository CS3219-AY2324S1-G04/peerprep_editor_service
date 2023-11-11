import { Redis } from 'ioredis';
import awarenessProtocol, {
  Awareness,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';

import AwarenessUpdate from '../interfaces/awareness_update';

export default class RedisAwareness {
  private _roomId: string;
  private _redisSub: Redis;
  private _redisPub: Redis;
  private _awareness: Awareness;

  public constructor(roomId: string, awareness: Awareness) {
    this._roomId = roomId;
    this._redisSub = new Redis();
    this._redisPub = new Redis();
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

  private _publishAwarenessUpdate = (
    { added, updated, removed }: AwarenessUpdate,
    source: unknown,
  ) => {
    if (source instanceof RedisAwareness) {
      return;
    }
    const changedClients = added.concat(updated, removed);

    const encoded = encodeAwarenessUpdate(this._awareness, changedClients);
    const message = Buffer.from(encoded);
    this._redisPub.publish(`${this._roomId}:awareness`, message);
  };

  // TODO: Teardown on delete room.
}
