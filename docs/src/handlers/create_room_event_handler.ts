import { RedisPersistence } from 'y-redis';
import Y from 'yjs';

import EditorDocsConfig from '../configs/editor_docs_config';
import { getQuestion } from '../services/question_service';
import {
  EventType,
  Room,
  RoomEvent,
} from '../services/room_service_mq_consumer';
import RoomEventHandler from './room_event_handler';

export default class CreateRoomEventHandler extends RoomEventHandler {
  private _persistence: RedisPersistence;
  private _editorDocsConfig: EditorDocsConfig;

  public constructor(
    editorDocsConfig: EditorDocsConfig,
    persistence: RedisPersistence,
  ) {
    super();
    this._editorDocsConfig = editorDocsConfig;
    this._persistence = persistence;
  }

  public override get eventType(): EventType {
    return EventType.create;
  }

  public override get handle(): (roomEvent: RoomEvent) => Promise<void> {
    return async (roomEvent: RoomEvent) => {
      console.log('create room', roomEvent);
      const yDoc = new Y.Doc();
      const room = roomEvent.room;

      // TODO: Allow only only one instance of editor docs to setup doc.
      await this._setupDoc(room, yDoc);
      this._persistence.bindState(room.roomId, yDoc);
    };
  }

  private async _setupDoc(room: Room, yDoc: Y.Doc) {
    let template: string;

    try {
      template = await this._getTemplateForRoom(room);
      console.log('Using template', template);
    } catch (error) {
      console.log('No template! ', error);
      template = '';
    }

    yDoc.getText().insert(0, template);
  }

  private async _getTemplateForRoom(room: Room) {
    console.log('Getting question', room.questionId, room.roomId);
    const question = await getQuestion(
      this._editorDocsConfig.questionServiceApi,
      room.questionId,
    );

    const template = question.templates.find((t) => {
      return t.langSlug === room.questionLangSlug;
    });

    if (template == undefined) {
      throw new Error('Template not found! Ignoring template.');
    }

    return template.code;
  }
}
