/**
 * @file Entry point to the program.
 */
import http from 'http';
import WebSocket from 'ws';

import { setupWSConnection } from './setup';

const wss = new WebSocket.Server({ noServer: true });

const port = process.env.PORT || 9004;

const server = http.createServer((request, response) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

wss.on('connection', setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  const handleAuth = (client : WebSocket) => {
    wss.emit('connection', client, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

server.listen(port, () => {
  console.log(`running on port ${port}`);
});
