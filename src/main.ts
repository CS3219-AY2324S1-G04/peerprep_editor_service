/**
 * @file Entry point to the program.
 */
import { RedisPersistence } from 'y-redis';

import App from './app';
import EditorApiConfig from './configs/editor_api_config';
import RedisClientConfig from './configs/redis_client_config';
import DocsManager from './docs_manager';
import RoomConnectionHandler from './handlers/room_connection_handler';
import RoomUpgradeHandler from './handlers/room_upgrade_handler';
import AccessTokenVerifier from './service/access_token_verifier';
import RedisClient from './service/redis_client';
import RedisDocsService from './service/redis_docs_service';
import { getAccessTokenPublicKey } from './service/user_service';

/**
 *
 */
async function run(): Promise<void> {
  const apiConfig = new EditorApiConfig();
  const redisClientConfig = new RedisClientConfig();

  const accessTokenVerifier: AccessTokenVerifier = new AccessTokenVerifier(
    await getAccessTokenPublicKey(apiConfig.userServiceApi),
  );

  const redisClient = new RedisClient(redisClientConfig);

  const docsManager = new DocsManager(
    redisClient,
    new RedisPersistence({ redisOpts: redisClientConfig }),
    new RedisDocsService(redisClient),
  );

  const app = new App(
    apiConfig,
    new RoomConnectionHandler(docsManager),
    new RoomUpgradeHandler(apiConfig, docsManager, accessTokenVerifier),
  );

  app.start();
}

run();
