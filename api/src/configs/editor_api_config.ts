/**
 * @file Editor API config using .env as default.
 */
const defaultPort = 9004;

const portEnv = 'PORT';
const roomServiceApiEnv = 'ROOM_SERVICE_API';
const questionServiceApiEnv = 'QUESTION_SERVICE_API';

class EditorApiConfig {
  public readonly port: number;
  public readonly roomServiceApi: string;
  public readonly questionServiceApi: string;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.port = EditorApiConfig._parseInt(env[portEnv]) ?? defaultPort;
    this.roomServiceApi = env[roomServiceApiEnv] ?? '';
    this.questionServiceApi = env[questionServiceApiEnv] ?? '';
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
