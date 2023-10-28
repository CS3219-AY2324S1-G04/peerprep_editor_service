/**
 * @file Manages docs.
 */
import { LeveldbPersistence } from 'y-leveldb';
import Y from 'yjs';

import EditorApiConfig from './configs/editor_api_config';
import { getQuestion } from './service/question_service';
import { getRoom } from './service/room_service';
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
  private _editorApiConfig: EditorApiConfig;

  public constructor(
    editorApiConfig: EditorApiConfig,
    gcEnabled: boolean = true,
  ) {
    this._editorApiConfig = editorApiConfig;
    this._docs = new Map();
    this._gcEnabled = gcEnabled;
  }

  public get docs() {
    return this._docs;
  }

  public async getDoc(roomId: string) {
    if (this._docs.has(roomId)) {
      return this._docs.get(roomId);
    } else {
      const newDoc = await this._setupDoc(roomId);
      this._docs.set(roomId, newDoc);
      return newDoc;
    }
  }

  public removeDoc(roomId: string) {
    this._docs.delete(roomId);
  }

  private async _setupDoc(roomId: string) {
    let data: string;

    try {
      const room = await getRoom(this._editorApiConfig.roomServiceApi, roomId);

      if (room == undefined) {
        throw new Error('Room not found! Ignoring template.');
      }

      console.log('Getting question', room.questionId, room.roomId);
      const question = await getQuestion(
        this._editorApiConfig.questionServiceApi,
        room.questionId,
      );

      if (question == undefined) {
        throw new Error('Question not found! Ignoring template.');
      }

      const template = question.templates.find((t) => {
        return t.language === 'JavaScript';
      });

      if (template == undefined) {
        throw new Error('Template not found! Ignoring template.');
      }

      console.log('Using template', template);

      data = template.code;
    } catch (error) {
      console.log('No template! ', error);
      data = '';
    }

    return this._createDoc(roomId, data);
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
