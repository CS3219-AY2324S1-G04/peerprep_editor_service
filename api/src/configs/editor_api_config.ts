/**
 * @file Editor API config using .env as default.
 */
import { env } from 'process';

const defaultPort = parseInt(env['PORT'] || '9004');

class EditorApiConfig {
  public readonly port: number;

  public constructor(port: number = defaultPort) {
    this.port = port;
  }
}

export default EditorApiConfig;
