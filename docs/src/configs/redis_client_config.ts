const redisHostEnv = 'REDIS_HOST';
const redisPortEnv = 'REDIS_PORT';

const defaultRedisHost = 'localhost';
const defaultRedisPort = 6379;

export default class RedisClientConfig {
  public readonly host: string;
  public readonly port: number;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.host = env[redisHostEnv] ?? defaultRedisHost;
    this.port = this._parseInt(env[redisPortEnv]) ?? defaultRedisPort;
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
