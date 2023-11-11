/**
 * @file Defines {@link EditorDocsConfig}.
 */
const appModeEnv = 'NODE_ENV';
const portEnv = 'PORT';
const docsServiceRouteEnv = 'DOCS_SERVICE_ROUTE';
const questionServiceApiEnv = 'QUESTION_SERVICE_API';

const defaultPort = 9007;
const defaultDocsServiceRoute = '/docs-service';
const defaultQuestionServiceApi = 'http://localhost:9001/question-service';

class EditorDocsConfig {
  public readonly isDevEnv: boolean;
  public readonly port: number;
  public readonly docsServiceRoute: string;
  public readonly questionServiceApi: string;

  public constructor(env: NodeJS.ProcessEnv = process.env) {
    this.isDevEnv = env[appModeEnv] == 'development' ?? false;
    this.port = this._parseInt(env[portEnv]) ?? defaultPort;
    this.docsServiceRoute = env[docsServiceRouteEnv] ?? defaultDocsServiceRoute;
    this.questionServiceApi =
      env[questionServiceApiEnv] ?? defaultQuestionServiceApi;
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

export default EditorDocsConfig;
