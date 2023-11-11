/**
 * @file Room service.
 */
import { Axios } from 'axios';

import RoomModel from '../models/room_model';

const SUCCESS_CODE = 200;
const RES_FAILURE_ERR_MSG = 'Request failed!';

const ROOM_ID_DATA_KEY = 'room-id';
const USER_IDS_DATA_KEY = 'user-ids';
const QUESTION_ID_DATA_KEY = 'question-id';
const QUESTION_LANG_SLUG_KEY = 'question-lang-slug';

/**
 * Get room info for room id.
 * @param roomServiceApi - The room service api.
 * @param roomId - The room id.
 * @returns Room model for room id if room exists, null otherwise.
 */
async function getRoom(
  roomServiceApi: string,
  roomId: string,
): Promise<RoomModel | null> {
  const axios = new Axios({
    baseURL: roomServiceApi,
    withCredentials: true,
  });
  const res = await axios.get(`/rooms/${roomId}`);

  if (res.status != SUCCESS_CODE) {
    throw new Error(RES_FAILURE_ERR_MSG);
  }

  const data = JSON.parse(res.data);

  return new RoomModel(
    roomId,
    data[USER_IDS_DATA_KEY],
    data[QUESTION_ID_DATA_KEY],
    data[QUESTION_LANG_SLUG_KEY],
  );
}

/**
 * Get room info for user.
 * @param roomServiceApi - The room service api.
 * @param sessionToken - The user session token.
 * @returns Room model for room id if room exists, null otherwise.
 */
async function getUserRoomInfo(
  roomServiceApi: string,
  sessionToken: string,
): Promise<RoomModel | null> {
  const axios = new Axios({
    baseURL: roomServiceApi,
    withCredentials: true,
  });
  const res = await axios.post(`/room/?session-token=${sessionToken}`);

  if (res.status != SUCCESS_CODE) {
    throw new Error(RES_FAILURE_ERR_MSG);
  }

  const data = JSON.parse(res.data).data;

  return new RoomModel(
    data[ROOM_ID_DATA_KEY],
    data[USER_IDS_DATA_KEY],
    data[QUESTION_ID_DATA_KEY],
    data[QUESTION_LANG_SLUG_KEY],
  );
}

export { getRoom, getUserRoomInfo };
