import { RoomServiceMqConsumerConfig } from '../services/room_service_mq_consumer';

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
    // TODO: Use env variables.
    this.user = defaultUser;
    this.password = defaultPassword;
    this.host = defaultHost;
    this.port = defaultPort;
    this.vhost = '';
    this.shouldUseTls = false;
    this.exchangeName = defaultExchangeName;
    this.queueName = defaultQueueName;
  }

  private static _parseInt(v: string | undefined): number | undefined {
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
