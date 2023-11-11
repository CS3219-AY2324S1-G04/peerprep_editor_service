/**
 * @file Editor API config using .env as default.
 */
const defaultPort = 9004;

const portEnv = 'PORT';
const questionServiceApiEnv = 'QUESTION_SERVICE_API';

const defaultQuestionServiceApi = 'http://localhost:9001/question-service';

class EditorDocsConfig {
  public readonly port: number;
  public readonly questionServiceApi: string;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.port = EditorDocsConfig._parseInt(env[portEnv]) ?? defaultPort;
    this.questionServiceApi =
      env[questionServiceApiEnv] ?? defaultQuestionServiceApi;
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

export default EditorDocsConfig;
