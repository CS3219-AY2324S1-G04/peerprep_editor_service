/**
 * @file Defines {@link RoomServiceMqConfig}.
 */
import { RoomServiceMqConsumerConfig } from '../services/room_service_mq_consumer';

const userEnv = 'MQ_USER';
const passEnv = 'MQ_PASSWORD';
const hostEnv = 'MQ_HOST';
const portEnv = 'MQ_PORT';
const exchangeEnv = 'MQ_EXCHANGE_NAME';
const queueEnv = 'MQ_QUEUE_NAME';

const defaultUser = 'user';
const defaultPassword = 'P@ssword123';
const defaultHost = 'localhost';
const defaultPort = 5672;
const defaultExchangeName = 'room-events';
const defaultQueueName = 'editor-service-docs-room-event-queue';

export default class RoomServiceMqConfig
  implements RoomServiceMqConsumerConfig
{
  public readonly user: string;
  public readonly password: string;
  public readonly host: string;
  public readonly port: number;
  public readonly vhost: string;
  public readonly shouldUseTls: boolean;
  public readonly exchangeName: string;
  public readonly queueName: string;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.user = env[userEnv] ?? defaultUser;
    this.password = env[passEnv] ?? defaultPassword;
    this.host = env[hostEnv] ?? defaultHost;
    this.port = this._parseInt(env[portEnv]) ?? defaultPort;
    this.exchangeName = env[exchangeEnv] ?? defaultExchangeName;
    this.queueName = env[queueEnv] ?? defaultQueueName;

    this.vhost = '';
    this.shouldUseTls = false;
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
