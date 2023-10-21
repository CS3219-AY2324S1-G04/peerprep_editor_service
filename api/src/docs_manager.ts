/**
 * @file Manages docs.
 */
import { setIfUndefined } from 'lib0/map';
import { LeveldbPersistence } from 'y-leveldb';
import Y from 'yjs';

import { Persistence } from './utils';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

const persistenceDir = process.env.YPERSISTENCE;

let persistence: Persistence = null;

// Initialise levelDb for persistence.
if (typeof persistenceDir === 'string') {
  console.info('Persisting documents to "' + persistenceDir + '"');
  const ldb = new LeveldbPersistence(persistenceDir);

  persistence = {
    provider: ldb,

    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);

      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

      ydoc.on('update', (update: Uint8Array) => {
        ldb.storeUpdate(docName, update);
      });
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    writeState: async (docName: string, ydoc: WSSharedDoc) => {},
  };
}

export default class DocsManager {
  private _docs: Map<string, WSSharedDoc>;

  public constructor() {
    this._docs = new Map();
  }

  public get docs() {
    return this._docs;
  }

  public getDoc(room: string, gc = true) {
    return setIfUndefined(this._docs, room, () => {
      return this._createDoc(room, gc);
    });
  }

  public removeDoc(room: string) {
    this._docs.delete(room);
  }

  private _createDoc(room: string, gc: boolean) {
    const doc = new WSSharedDoc(room, gcEnabled);
    doc.gc = gc;

    if (persistence !== null) {
      persistence.bindState(room, doc);
    }

    this._docs.set(room, doc);

    return doc;
  }
}
