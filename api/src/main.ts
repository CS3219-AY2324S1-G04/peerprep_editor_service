/**
 * @file Entry point to the program.
 */
import http from 'http';
import WebSocket from 'ws';

import App from './app';
import EditorApiConfig from './configs/editor_api_config';

const httpServer = http.createServer();
const wss = new WebSocket.Server({ noServer: true });
const apiConfig = new EditorApiConfig();

const app = new App(httpServer, wss, apiConfig);

app.start();
