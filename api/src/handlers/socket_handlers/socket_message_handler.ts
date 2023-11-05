/**
 * @file Handles socket messages.
 */
import { Decoder } from 'lib0/decoding';

import { MessageType } from '../../enums/message_type';

export default abstract class SocketMessageHandler {
  public abstract get messageType(): MessageType;
  public abstract get handle(): (decoder: Decoder) => void;
}
