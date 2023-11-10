/**
 * @file Manages docs.
 */
import EditorApiConfig from './configs/editor_api_config';
import { getQuestion } from './service/question_service';
import { getRoom } from './service/room_service';
import WSSharedDoc from './ws_shared_doc';

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export default class DocsManager {
  private _wsDocs: Map<string, WSSharedDoc>;
  private _gcEnabled: boolean;
  private _editorApiConfig: EditorApiConfig;

  public constructor(
    editorApiConfig: EditorApiConfig,
    gcEnabled: boolean = true,
  ) {
    this._editorApiConfig = editorApiConfig;
    this._wsDocs = new Map();
    this._gcEnabled = gcEnabled;
  }

  public async setupDocIfNotExist(
    roomId: string,
  ): Promise<WSSharedDoc | undefined> {
    if (this._wsDocs.has(roomId)) {
      return this._wsDocs.get(roomId);
    }

    const newDoc = await this._setupDoc(roomId);
    this._wsDocs.set(roomId, newDoc);
    return newDoc;
  }

  public getDoc(roomId: string): WSSharedDoc | undefined {
    return this._wsDocs.get(roomId);
  }

  public removeDoc(roomId: string): void {
    this._wsDocs.delete(roomId);
  }

  private async _setupDoc(roomId: string) {
    let data: string;

    try {
      data = await this._getTemplateForRoom(roomId);
      console.log('Using template', data);
    } catch (error) {
      console.log('No template! ', error);
      data = '';
    }

    return this._createDoc(roomId, data);
  }

  private async _getTemplateForRoom(roomId: string) {
    const room = await getRoom(this._editorApiConfig.roomServiceApi, roomId);

    if (room == undefined) {
      throw new Error('Room not found! Ignoring template.');
    }

    console.log('Getting question', room.questionId, room.roomId);
    const question = await getQuestion(
      this._editorApiConfig.questionServiceApi,
      room.questionId,
    );

    const template = question.templates.find((t) => {
      return t.langSlug === room.langSlug;
    });

    if (template == undefined) {
      throw new Error('Template not found! Ignoring template.');
    }

    return template.code;
  }

  private _createDoc(roomId: string, data: string = '') {
    const doc = new WSSharedDoc(roomId, gcEnabled, data);
    doc.gc = this._gcEnabled;

    this._wsDocs.set(roomId, doc);

    return doc;
  }
}
