/**
 * @file Defines {@link RouteHandler}.
 */
import express from 'express';

import HttpErrorInfo from '../../models/http_error_info';

export default abstract class RouteHandler {
  public get handle() {
    return async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        await this.handleLogic(req, res, next);
      } catch (e) {
        if (e instanceof HttpErrorInfo) {
          res.status(e.statusCode).send(e.message);
        } else {
          res.sendStatus(500);
        }
      }
    };
  }

  public abstract get route(): string;

  public abstract get method(): HttpMethod;

  protected abstract handleLogic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void>;
}

export enum HttpMethod {
  get,
  post,
  put,
  delete,
}
