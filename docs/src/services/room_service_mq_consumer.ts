import amqp from 'amqplib';

/** Consumes room events. */
export default class RoomServiceMqConsumer {
  private readonly _setupPromise: Promise<void>;
  private readonly _queueName: string;

  private _connection: amqp.Connection | undefined;
  private _channel: amqp.Channel | undefined;

  /**
   * @param config - Contains configs.
   */
  public constructor(config: RoomServiceMqConsumerConfig) {
    this._queueName = config.queueName;

    this._setupPromise = (async () => {
      const user: string = encodeURIComponent(config.user);
      const password: string = encodeURIComponent(config.password);

      const protocol: string = config.shouldUseTls ? 'amqps' : 'amqp';
      const url: string = `${protocol}://${user}:${password}@${config.host}:${
        config.port
      }${config.vhost === '' ? '' : `/${config.vhost}`}`;

      this._connection = await amqp.connect(url);
      this._channel = await this._connection.createChannel();

      await this._channel.assertExchange(config.exchangeName, 'fanout', {
        durable: true,
      });
      await this._channel.assertQueue(config.queueName, { durable: true });
      await this._channel.bindQueue(config.queueName, config.exchangeName, '');
    })();
  }

  /** Initialises the client. */
  public async initialise(): Promise<void> {
    await this._setupPromise;
  }

  /** Disconnects from the MQ. */
  public async disconnect(): Promise<void> {
    await this._channel?.close();
    await this._connection?.close();
  }

  /**
   * Consumes from the MQ via the callback {@link onMessage}.
   *
   * If {@link onMessage} executes and returns without any errors, the message
   * will be acknowledged. If {@link onMessage} throws an error, the message
   * will not be acknowledged. In which case, the message may be consumed again.
   *
   * This function does not block until a message is consumed. It returns when
   * the callback is successfully set.
   * @param onMessage - Callback that is called whenever a room event is
   * consumed from the MQ.
   */
  public async consume(onMessage: (data: RoomEvent) => void): Promise<void> {
    await this._channel?.consume(
      this._queueName,
      async (msg) => {
        if (msg === null) {
          return;
        }

        try {
          const data = JSON.parse(msg.content.toString());
          await onMessage({
            eventType: data['event-type'],
            room: {
              roomId: data['room']['room-id'],
              userIds: data['room']['user-ids'],
              questionId: data['room']['question-id'],
              questionLangSlug: data['room']['question-lang-slug'],
            },
            removedUserId: data['removed-user-id'],
          });
          this._channel?.ack(msg);
        } catch (e) {
          console.error(e);
        }
      },
      { noAck: false },
    );
  }
}

/** Room event. */
export interface RoomEvent {
  readonly eventType: EventType;
  readonly room: Room;
  readonly removedUserId: number; // Only used by remove user event
}

/** Room. */
export interface Room {
  readonly roomId: string;
  readonly userIds: number[];
  readonly questionId: string;
  readonly questionLangSlug: string;
}

/** Event type. */
export enum EventType {
  create = 'create',
  delete = 'delete',
  removeUser = 'remove-user',
}

/** Config for the Room Service MQ consumer. */
export interface RoomServiceMqConsumerConfig {
  readonly password: string;
  readonly user: string;
  readonly host: string;
  readonly port: number;
  readonly vhost: string;
  readonly shouldUseTls: boolean;
  readonly exchangeName: string;
  readonly queueName: string;
}
