/**
 * @file Entry point to the program.
 */
import { RedisPersistence } from 'y-redis';

import App from './app';
import EditorDocsConfig from './configs/editor_docs_config';
import RoomServiceMqConfig from './configs/room_service_mq_config';
import CreateRoomEventHandler from './handlers/create_room_event_handler';
import RoomServiceMq from './services/room_service_mq';

const config = new EditorDocsConfig();
const mqConfig = new RoomServiceMqConfig();
const redisPersistence = new RedisPersistence();
const roomServiceMq = new RoomServiceMq(mqConfig, [
  new CreateRoomEventHandler(config, redisPersistence),
]);

const app = new App(redisPersistence, roomServiceMq);

app.start();
