/**
 * @file Manages docs.
 */
import { RedisPersistence } from 'y-redis';

import EditorApiConfig from './configs/editor_api_config';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export default class DocsManager {
  private _wsDocs: Map<string, WSSharedDoc>;
  private _gcEnabled: boolean;
  private _editorApiConfig: EditorApiConfig;
  private _redisPersistence: RedisPersistence;

  public constructor(
    editorApiConfig: EditorApiConfig,
    gcEnabled: boolean = true,
  ) {
    this._editorApiConfig = editorApiConfig;
    this._wsDocs = new Map();
    this._gcEnabled = gcEnabled;
    this._redisPersistence = new RedisPersistence();
  }

  public async setupDocIfNotExist(
    roomId: string,
  ): Promise<WSSharedDoc | undefined> {
    if (this._wsDocs.has(roomId)) {
      return this._wsDocs.get(roomId);
    }

    const newDoc = this._createDoc(roomId);
    this._wsDocs.set(roomId, newDoc);
    return newDoc;
  }

  public getDoc(roomId: string): WSSharedDoc | undefined {
    return this._wsDocs.get(roomId);
  }

  public removeDoc(roomId: string): void {
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
