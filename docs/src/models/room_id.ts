/**
 * @file Defines {@link RoomId}.
 */
import { randomUUID } from 'crypto';

/** Room ID. */
export default class RoomId {
  private readonly _roomId: string;

  private constructor(roomId: string) {
    this._roomId = roomId;
  }

  /**
   * Parses {@link rawRoomId} as a room ID.
   * @param rawRoomId - Room ID.
   * @returns The parsed {@link RoomId}.
   * @throws Error if parsing fails.
   */
  public static parse(rawRoomId: unknown): RoomId {
    if (!RoomId._isString(rawRoomId)) {
      throw new Error('Room ID must be a string.');
    }

    if (!RoomId._isStringSpecified(rawRoomId as string | undefined)) {
      throw new Error('Room ID cannot be empty.');
    }

    return new RoomId(rawRoomId as string);
  }

  /**
   * Creates a {@link RoomId} by using a random value.
   * @returns Created {@link RoomId}.
   */
  public static create(): RoomId {
    return new RoomId(randomUUID());
  }

  private static _isString(rawRoomId: unknown): boolean {
    return typeof rawRoomId === 'string' || rawRoomId === undefined;
  }

  private static _isStringSpecified(rawRoomId: string | undefined): boolean {
    return rawRoomId !== undefined && rawRoomId.length > 0;
  }

  /** @returns String representation. */
  public toString(): string {
    return this._roomId;
  }
}
