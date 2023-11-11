/**
 * @file Question service.
 */
import { Axios } from 'axios';

import QuestionModel from '../models/question_model';

/**
 * Get question info for question id.
 * @param questionServiceApi - The question service api.
 * @param questionId - The question id.
 * @returns Question model for question id if question exists, null otherwise.
 */
async function getQuestion(questionServiceApi: string, questionId: string) {
  const axios = new Axios({
    baseURL: questionServiceApi,
  });

  const res = await axios.get(`questions/${questionId}`);
  const data = JSON.parse(res.data).data;
  return new QuestionModel(data['_id'], data['title'], data['template']);
}

export { getQuestion };
