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
  private _gcEnabled: boolean;

  public constructor(gcEnabled: boolean = true) {
    this._docs = new Map();
    this._gcEnabled = gcEnabled;
  }

  public get docs() {
    return this._docs;
  }

  public getDoc(roomId: string) {
    return setIfUndefined(this._docs, roomId, () => this._setupDoc(roomId));
  }

  public removeDoc(roomId: string) {
    this._docs.delete(roomId);
  }

  private _setupDoc(roomId: string) {
    return this._createDoc(roomId);
  }

  private _createDoc(roomId: string, data: string = '') {
    const doc = new WSSharedDoc(roomId, gcEnabled, data);
    doc.gc = this._gcEnabled;

    if (persistence !== null) {
      persistence.bindState(roomId, doc);
    }

    this._docs.set(roomId, doc);

    return doc;
  }
}
