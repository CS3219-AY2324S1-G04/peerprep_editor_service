/**
 * @file Manages docs.
 */
import { RedisPersistence } from 'y-redis';

import RedisAwareness from './service/redis_awareness';
import RedisClient from './service/redis_client';
import RedisDocsService from './service/redis_docs_service';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export default class DocsManager {
  private _wssDocs: Map<string, WSSharedDoc>;
  private _redisClient: RedisClient;
  private _redisPersistence: RedisPersistence;
  private _redisDocsService: RedisDocsService;

  public constructor(
    redisClient: RedisClient,
    redisPersistence: RedisPersistence,
    redisDocsService: RedisDocsService,
  ) {
    this._wssDocs = new Map();
    this._redisClient = redisClient;
    this._redisPersistence = redisPersistence;
    this._redisDocsService = redisDocsService;
  }

  public async setupDoc(roomId: string): Promise<WSSharedDoc> {
    if (this.hasDoc(roomId)) {
      throw new Error('Doc already exists! ' + roomId);
    }

    const wssDoc = this._createWssDoc(roomId);

    this._redisDocsService.subscribeToRoomDeletion(roomId, () => {
      this.removeDoc(roomId);
    });

    this._redisPersistence.bindState(roomId, wssDoc);

    const redisAwareness = new RedisAwareness(
      this._redisClient,
      roomId,
      wssDoc.awareness,
    );

    await redisAwareness.connect();

    this._wssDocs.set(roomId, wssDoc);
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

  public removeDoc(roomId: string): void {
    const doc = this._wssDocs.get(roomId);
    doc?.destroy();
    this._wssDocs.delete(roomId);
  }

  private _createWssDoc(roomId: string) {
    const wssDoc = new WSSharedDoc(roomId, gcEnabled);
    this._wssDocs.set(roomId, wssDoc);
    return wssDoc;
  }
}
