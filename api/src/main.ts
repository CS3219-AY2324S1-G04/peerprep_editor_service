/**
 * @file Entry point to the program.
 */
import http from 'http';
import { Duplex } from 'stream';
import WebSocket from 'ws';

import ConnectionHandler from './connection_handler';

const wss = new WebSocket.Server({ noServer: true });
const port = process.env.PORT || 9004;

/**
 * Initializes server.
 */
function init() {
  const server = http.createServer();
  const connectionHandler = new ConnectionHandler();

  wss.on('connection', connectionHandler.handle);

  server.on('upgrade', handleUpgrade);
  server.listen(port, () => {
    console.log(`running on port ${port}`);
  });
}

const handleUpgrade = (
  request: http.IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => {
  if (!request.url || !request.url.match(/^\/dev/)) {
    console.log('reject', request.url);
    return;
  }

  const handleAuth = (client: WebSocket) => {
    wss.emit('connection', client, request);
  };

  wss.handleUpgrade(request, socket, head, handleAuth);
};

init();
