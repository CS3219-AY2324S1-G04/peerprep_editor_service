/**
 * @file Question service.
 */
import { Axios } from 'axios';

import QuestionModel from '../models/question_model';

const SUCCESS_CODE = 200;
const RES_FAILURE_ERR_MSG = 'Request failed!';

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

  try {
    console.log('Getting question', questionId);

    const res = await axios.get(`questions/${questionId}`);

    if (res.status != SUCCESS_CODE) {
      throw new Error(RES_FAILURE_ERR_MSG);
    }

    const data = JSON.parse(res.data).data;

    return new QuestionModel(data['_id'], data['title'], data['template']);
  } catch (error) {
    console.log('Failed to get question!', questionId);
    return null;
  }
}

export { getQuestion };
