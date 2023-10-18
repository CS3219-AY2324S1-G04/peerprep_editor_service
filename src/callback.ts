/**
 * @file Callbacks for yjs websocket.
 */
import http from 'http';

import WSSharedDoc from './ws_shared_doc';

const CALLBACK_URL = process.env.CALLBACK_URL
  ? new URL(process.env.CALLBACK_URL)
  : null;

const CALLBACK_TIMEOUT = process.env.CALLBACK_TIMEOUT || 5000;

const CALLBACK_OBJECTS = process.env.CALLBACK_OBJECTS
  ? JSON.parse(process.env.CALLBACK_OBJECTS)
  : {};

export const isCallbackSet = !!CALLBACK_URL;

export const callbackHandler = (
  update: object,
  origin: unknown,
  doc: WSSharedDoc,
) => {
  const room = doc.name;

  const dataToSend: {
    room: string;
    data: { [index: string]: object };
  } = {
    room,
    data: {},
  };

  const sharedObjectList: string[] = Object.keys(CALLBACK_OBJECTS);

  sharedObjectList.forEach((sharedObjectName: string) => {
    const sharedObjectType = CALLBACK_OBJECTS;
    const content = getContent(sharedObjectName, sharedObjectType, doc);

    if (content != null) {
      dataToSend.data[sharedObjectName] = {
        type: sharedObjectType,
        content: content.toJSON(),
      };
    }
  });

  if (CALLBACK_URL != null) {
    callbackRequest(
      CALLBACK_URL,
      typeof CALLBACK_TIMEOUT == 'string'
        ? parseInt(CALLBACK_TIMEOUT)
        : CALLBACK_TIMEOUT,
      dataToSend,
    );
  }
};

const callbackRequest = (url: URL, timeout: number, data: object | string) => {
  data = JSON.stringify(data);

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    timeout,
    method: 'POST',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Length': data.length,
    },
  };

  const req = http.request(options);

  req.on('timeout', () => {
    console.warn('Callback request timed out.');
    req.abort();
  });
  req.on('error', (e) => {
    console.error('Callback request error.', e);
    req.abort();
  });
  req.write(data);
  req.end();
};

const getContent = (objName: string, objType: string, doc: WSSharedDoc) => {
  switch (objType) {
    case 'Array':
      return doc.getArray(objName);
    case 'Map':
      return doc.getMap(objName);
    case 'Text':
      return doc.getText(objName);
    case 'XmlFragment':
      return doc.getXmlFragment(objName);
    default:
      return null;
  }
};
