/**
 * @file Entry point to the program.
 */
import App from './app';
import EditorApiConfig from './configs/editor_api_config';

const apiConfig = new EditorApiConfig();
const app = new App(apiConfig);

app.start();
