/**
 * @file Represents a question.
 */
export default class QuestionModel {
  public readonly questionId: string;
  public readonly title: string;
  public readonly templates: QuestionTemplate[];

  public constructor(
    questionId: string,
    title: string,
    templates: QuestionTemplate[],
  ) {
    this.questionId = questionId;
    this.title = title;
    this.templates = templates;
  }
}

interface QuestionTemplate {
  language: string;
  code: string;
}
