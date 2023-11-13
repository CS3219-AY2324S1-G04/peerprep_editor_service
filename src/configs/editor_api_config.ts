/**
 * @file Editor API config using .env as default.
 */
const defaultPort = 9004;

const portEnv = 'PORT';
const serviceRouteEnv = 'SERVICE_ROUTE';
const userServiceApiEnv = 'USER_SERVICE_API';
const roomServiceApiEnv = 'ROOM_SERVICE_API';

const defaultServiceRoute = '/editor-service';
const defaultUserServiceApi = 'http://localhost:9000/user-service';
const defaultRoomServiceApi = 'http://localhost:9003/room-service';

class EditorApiConfig {
  public readonly port: number;
  public readonly serviceRoute: string;
  public readonly userServiceApi: string;
  public readonly roomServiceApi: string;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.serviceRoute = env[serviceRouteEnv] ?? defaultServiceRoute;
    this.port = EditorApiConfig._parseInt(env[portEnv]) ?? defaultPort;
    this.userServiceApi = env[userServiceApiEnv] ?? defaultUserServiceApi;
    this.roomServiceApi = env[roomServiceApiEnv] ?? defaultRoomServiceApi;
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

export default EditorApiConfig;
