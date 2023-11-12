/**
 * @file Entry point to the program.
 */
import { RedisPersistence } from 'y-redis';

import App from './app';
import EditorDocsConfig from './configs/editor_docs_config';
import RedisClientConfig from './configs/redis_client_config';
import RoomServiceMqConfig from './configs/room_service_mq_config';
import CreateRoomEventHandler from './handlers/create_room_event_handler';
import DeleteRoomEventHandler from './handlers/delete_room_event_handler';
import GetDocByRoomIdHandler from './handlers/route_handlers/get_doc_by_id_handler';
import RedisClient from './services/redis_client';
import RoomServiceMq from './services/room_service_mq';

const editorDocsConfig = new EditorDocsConfig();
const redisConfig = new RedisClientConfig();
const mqConfig = new RoomServiceMqConfig();

const redisPersistence = new RedisPersistence({ redisOpts: redisConfig });
const redisClient = new RedisClient(redisConfig);

const roomServiceMq = new RoomServiceMq(mqConfig, [
  new CreateRoomEventHandler(editorDocsConfig, redisClient, redisPersistence),
  new DeleteRoomEventHandler(redisClient, redisPersistence),
]);

const app = new App(
  editorDocsConfig,
  roomServiceMq,
  [new GetDocByRoomIdHandler(redisPersistence)],
  editorDocsConfig.isDevEnv,
);

app.start();
