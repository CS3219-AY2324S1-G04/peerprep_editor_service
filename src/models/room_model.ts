/**
 * @file Represents a room.
 */
export default class RoomModel {
  public readonly roomId: string;
  public readonly userIds: number[];
  public readonly questionId: string;
  public readonly langSlug: string;

  public constructor(
    roomId: string,
    userIds: number[],
    questionId: string,
    questionLangSlug: string,
  ) {
    this.roomId = roomId;
    this.userIds = userIds;

    if (!this.userIds) {
      this.userIds = [];
    }

    this.questionId = questionId;
    this.langSlug = questionLangSlug;
  }
}
