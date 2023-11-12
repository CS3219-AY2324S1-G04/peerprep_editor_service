/**
 * @file Defines {@link GetDocByRoomIdHandler}.
 */
import express from 'express';
import { Redis } from 'ioredis';
import { PersistenceDoc, RedisPersistence } from 'y-redis';
import Y from 'yjs';

import HttpErrorInfo from '../../models/http_error_info';
import RoomId from '../../models/room_id';
import RouteHandler, { HttpMethod } from './route_handler';

const roomIdParam = 'roomId';

export default class GetDocByRoomIdHandler extends RouteHandler {
  private _redisPersistence: RedisPersistence;

  public constructor(redisPersistence: RedisPersistence) {
    super();
    this._redisPersistence = redisPersistence;
  }

  public override get route(): string {
    return `/docs/:${roomIdParam}`;
  }

  public override get method(): HttpMethod {
    return HttpMethod.get;
  }

  protected override async handleLogic(
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ): Promise<void> {
    const roomId = this._getRoomId(req);
    const docText = await this._getRoomDocText(roomId);

    res.status(200).send({
      doc: docText,
    });
  }

  private _getRoomId(req: express.Request) {
    try {
      return RoomId.parse(req.params[roomIdParam]);
    } catch (e) {
      throw new HttpErrorInfo(
        400,
        JSON.stringify({ roomId: (e as Error).message }),
      );
    }
  }

  private async _getRoomDocText(roomId: RoomId): Promise<string> {
    try {
      const yDoc = await this._getYDoc(roomId);
      return yDoc.getText().toJSON();
    } catch (error) {
      throw new HttpErrorInfo(404, 'Document does not exist.');
    }
  }

  private async _getYDoc(roomId: RoomId): Promise<Y.Doc> {
    const pDoc = this._redisPersistence.docs.get(roomId.toString());

    if (pDoc) {
      return pDoc.doc;
    }

    // Retrieve doc from database if not in memory.
    const yDoc = new Y.Doc();

    const redis: Redis = this._redisPersistence.redis;
    const updatesLen = await redis.llen(`${roomId}:updates`);

    if (updatesLen <= 0) {
      throw new Error('Doc not on database!');
    }

    const newPDoc = new PersistenceDoc(
      this._redisPersistence,
      roomId.toString(),
      yDoc,
    );

    await newPDoc.getUpdates();
    await newPDoc.destroy();

    return yDoc;
  }
}
