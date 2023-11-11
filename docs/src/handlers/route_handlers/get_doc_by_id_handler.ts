/**
 * @file Defines {@link GetDocByRoomIdHandler}.
 */
import express from 'express';
import { RedisPersistence } from 'y-redis';

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
    const docText = this._getRoomDocText(roomId);

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

  private _getRoomDocText(roomId: RoomId) {
    const pDoc = this._redisPersistence.docs.get(roomId.toString());

    if (!pDoc) {
      throw new HttpErrorInfo(404, 'Document does not exist.');
    }

    return pDoc.doc.getText();
  }
}
