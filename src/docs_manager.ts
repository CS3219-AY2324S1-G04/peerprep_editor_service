/**
 * @file Manages docs.
 */
import { Awareness } from 'y-protocols/awareness';
import { RedisPersistence } from 'y-redis';

import RedisAwareness from './service/redis_awareness';
import RedisClient from './service/redis_client';
import RedisDocsService from './service/redis_docs_service';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export default class DocsManager {
  private _wssDocs: Map<string, WSSharedDoc>;
  private _awarenessMap: Map<string, RedisAwareness>;
  private _redisClient: RedisClient;
  private _redisPersistence: RedisPersistence;
  private _redisDocsService: RedisDocsService;

  public constructor(
    redisClient: RedisClient,
    redisPersistence: RedisPersistence,
    redisDocsService: RedisDocsService,
  ) {
    this._wssDocs = new Map();
    this._awarenessMap = new Map();
    this._redisClient = redisClient;
    this._redisPersistence = redisPersistence;
    this._redisDocsService = redisDocsService;
  }

  public async setupDoc(roomId: string): Promise<WSSharedDoc> {
    if (this.hasDoc(roomId)) {
      throw new Error('Doc already exists! ' + roomId);
    }

    const wssDoc = this._createWssDoc(roomId);

    await Promise.all([
      await this._createRedisAwareness(roomId, wssDoc.awareness),
      await this._redisDocsService.registerRoomDeletion(roomId, async () => {
        await this._removeDoc(roomId);
      }),
    ]);

    console.log(`Bind room ${roomId}`);
    return wssDoc;
  }

  public hasDoc(roomId: string) {
    return this._wssDocs.has(roomId);
  }

  public getDoc(roomId: string): WSSharedDoc {
    const doc = this._wssDocs.get(roomId);

    if (!doc) {
      throw new Error('Doc does not exist!');
    }

    return doc;
  }

  private _createWssDoc(roomId: string) {
    const wssDoc = new WSSharedDoc(roomId, gcEnabled, async () => {
      await this._removeDoc(roomId);
    });
    this._wssDocs.set(roomId, wssDoc);
    this._redisPersistence.bindState(roomId, wssDoc);
    return wssDoc;
  }

  private async _createRedisAwareness(roomId: string, awareness: Awareness) {
    const redisAwareness = new RedisAwareness(
      this._redisClient,
      roomId,
      awareness,
    );

    await redisAwareness.connect();

    this._awarenessMap.set(roomId, redisAwareness);
  }

  private async _removeDoc(roomId: string): Promise<void> {
    if (!this._wssDocs.has(roomId) && !this._awarenessMap.has(roomId)) {
      return;
    }

    await this._removeRedisAwareness(roomId);
    await this._removeWssDoc(roomId);

    console.log(`Unbind room ${roomId}`);
  }

  private async _removeWssDoc(roomId: string) {
    const wssDoc = this._wssDocs.get(roomId);
    wssDoc?.destroy();
    this._wssDocs.delete(roomId);

    await this._redisPersistence.closeDoc(roomId);
  }

  private async _removeRedisAwareness(roomId: string) {
    const redisAwareness = this._awarenessMap.get(roomId);
    redisAwareness?.disconnect();
    this._awarenessMap.delete(roomId);
  }
}
