/**
 * @file Manages docs.
 */
import { RedisPersistence } from 'y-redis';

import EditorApiConfig from './configs/editor_api_config';
import DocsService from './service/docs_service';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export default class DocsManager {
  private _wsDocs: Map<string, WSSharedDoc>;
  private _gcEnabled: boolean;
  private _editorApiConfig: EditorApiConfig;
  private _redisPersistence: RedisPersistence;
  private _docsService: DocsService;

  public constructor(
    editorApiConfig: EditorApiConfig,
    gcEnabled: boolean = true,
  ) {
    this._editorApiConfig = editorApiConfig;
    this._wsDocs = new Map();
    this._gcEnabled = gcEnabled;

    // TODO: Inject dependencies instead.
    this._redisPersistence = new RedisPersistence();
    this._docsService = new DocsService();
  }

  public async setupDoc(roomId: string): Promise<WSSharedDoc> {
    if (this.hasDoc(roomId)) {
      throw new Error('Doc already exists! ' + roomId);
    }

    const newDoc = this._createDoc(roomId);
    this._wsDocs.set(roomId, newDoc);

    this._docsService.subscribeToRoomDeletion(roomId, () => {
      this.removeDoc(roomId);
    });
    return newDoc;
  }

  public hasDoc(roomId: string) {
    return this._wsDocs.has(roomId);
  }

  public getDoc(roomId: string): WSSharedDoc {
    const doc = this._wsDocs.get(roomId);

    if (!doc) {
      throw new Error('Doc does not exist!');
    }

    return doc;
  }

  public removeDoc(roomId: string): void {
    const doc = this._wsDocs.get(roomId);
    doc?.destroy();
    this._wsDocs.delete(roomId);
  }

  private _createDoc(roomId: string) {
    const wssDoc = new WSSharedDoc(
      roomId,
      gcEnabled,
      '',
      this._redisPersistence,
    );

    wssDoc.gc = this._gcEnabled;
    this._wsDocs.set(roomId, wssDoc);

    return wssDoc;
  }
}
