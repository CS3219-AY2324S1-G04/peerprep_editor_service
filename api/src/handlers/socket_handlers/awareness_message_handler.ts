/**
 * @file Handles socket awareness messages.
 */
import { Decoder, readVarUint8Array } from 'lib0/decoding';
import awarenessProtocol, { Awareness } from 'y-protocols/awareness';

import { MessageType } from '../../enums/message_type';
import UserConnection from '../../user_connection';
import SocketMessageHandler from './socket_message_handler';

export default class AwarenessMessageHandler extends SocketMessageHandler {
  private _awareness: Awareness;
  private _conn: UserConnection;

  public constructor(awareness: Awareness, conn: UserConnection) {
    super();
    this._awareness = awareness;
    this._conn = conn;
  }

  public override get messageType() {
    return MessageType.messageAwareness;
  }

  public override get handle() {
    return (decoder: Decoder) => {
      awarenessProtocol.applyAwarenessUpdate(
        this._awareness,
        readVarUint8Array(decoder),
        this._conn,
      );
    };
  }
}
