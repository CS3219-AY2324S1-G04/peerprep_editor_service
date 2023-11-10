/**
 * @file Handles socket sync messages.
 */
import { Decoder } from 'lib0/decoding';
import {
  createEncoder,
  length,
  toUint8Array,
  writeVarUint,
} from 'lib0/encoding';
import syncProtocol from 'y-protocols/sync';
import Y from 'yjs';

import { MessageType } from '../../enums/message_type';
import UserConnection from '../../user_connection';
import SocketMessageHandler from './socket_message_handler';

export default class SyncMessageHandler extends SocketMessageHandler {
  private _yDoc: Y.Doc;
  private _conn: UserConnection;

  public constructor(yDoc: Y.Doc, conn: UserConnection) {
    super();
    this._yDoc = yDoc;
    this._conn = conn;
  }

  public override get messageType() {
    return MessageType.messageSync;
  }

  public override get handle() {
    return (decoder: Decoder) => {
      try {
        const encoder = createEncoder();
        writeVarUint(encoder, MessageType.messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, this._yDoc, this._conn);

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (length(encoder) > 1) {
          console.log('Send sync step 2');
          this._conn.send(toUint8Array(encoder));
        }
      } catch (err) {
        console.error('sync error', err);
        this._yDoc.emit('error', [err]);
      }
    };
  }
}
