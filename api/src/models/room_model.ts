/**
 * @file Represents a room.
 */
export default class RoomModel {
  public readonly roomId: string;
  public readonly userIds: string[];
  public readonly questionId: string;
  public readonly langSlug: string;

  public constructor(
    roomId: string,
    userIds: string[],
    questionId: string,
    questionLangSlug: string,
  ) {
    this.roomId = roomId;
    this.userIds = userIds;
    this.questionId = questionId;
    this.langSlug = questionLangSlug;
  }
}
