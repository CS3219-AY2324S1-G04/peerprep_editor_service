import { RedisOptions } from "ioredis/built/cluster/util";

/**
 * @file Redis client config using .env as default.
 */
const redisHostEnv = 'REDIS_HOST';
const redisPortEnv = 'REDIS_PORT';
const redisUsernameEnv = 'REDIS_USERNAME';
const redisPasswordEnv = 'REDIS_PASSWORD';
const redisDbEnv = 'REDIS_DB';

const defaultRedisHost = 'localhost';
const defaultRedisPort = 6379;
const defaultRedisUsername = 'default';
const defaultRedisPassword = 'password';
const defaultRedisDb = 0;

export default class RedisClientConfig implements RedisOptions {
  public readonly host: string;
  public readonly port: number;
  public readonly username: string;
  public readonly password: string;
  public readonly db: number;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.host = env[redisHostEnv] ?? defaultRedisHost;
    this.port = this._parseInt(env[redisPortEnv]) ?? defaultRedisPort;
    this.username = env[redisUsernameEnv] ?? defaultRedisUsername;
    this.password = env[redisPasswordEnv] ?? defaultRedisPassword;
    this.db = this._parseInt(env[redisDbEnv]) ?? defaultRedisDb;
  }

  private _parseInt(v: string | undefined): number | undefined {
    if (v === undefined) {
      return undefined;
    }

    const val: number = parseFloat(v);
    if (isNaN(val) || !Number.isInteger(val)) {
      return undefined;
    }

    return val;
  }
}
