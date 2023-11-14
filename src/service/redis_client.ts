/**
 * @file Defines {@link RedisClientConfig}.
 */
import { Redis } from 'ioredis';

import RedisClientConfig from '../configs/redis_client_config';

export default class RedisClient {
  private _config: RedisClientConfig;

  public constructor(config: RedisClientConfig) {
    this._config = config;
  }

  public createInstance(): Redis {
    return new Redis(this._config);
  }
}
