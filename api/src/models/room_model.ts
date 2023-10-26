/**
 * @file Represents a room.
 */
export default class RoomModel {
  public readonly roomId: string;
  public readonly userIds: string[];
  public readonly questionId: string;

  public constructor(roomId: string, userIds: string[], questionId: string) {
    this.roomId = roomId;
    this.userIds = userIds;
    this.questionId = questionId;
  }
}
