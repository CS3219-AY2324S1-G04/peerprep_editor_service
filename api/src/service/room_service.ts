/**
 * @file Room service.
 */
import { Axios } from 'axios';

import RoomModel from '../models/room_model';

const SUCCESS_CODE = 200;
const RES_FAILURE_ERR_MSG = 'Request failed!';

const ROOM_ID_DATA_KEY = 'room-id';
const USER_IDS_DATA_KEY = 'users';
const QUESTION_ID_DATA_KEY = 'questions-id';

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

  try {
    const res = await axios.get(`/room/${roomId}/info`);

    if (res.status != SUCCESS_CODE) {
      throw new Error(RES_FAILURE_ERR_MSG);
    }

    const data = JSON.parse(res.data).data;

    return new RoomModel(
      roomId,
      data[USER_IDS_DATA_KEY],
      data[QUESTION_ID_DATA_KEY],
    );
  } catch (error) {
    console.log('Failed to get room info!', error);
    return null;
  }
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

  try {
    const res = await axios.post(`/room/user/?session-token=${sessionToken}`);

    if (res.status != SUCCESS_CODE) {
      throw new Error(RES_FAILURE_ERR_MSG);
    }

    const data = JSON.parse(res.data).data;

    return new RoomModel(
      data[ROOM_ID_DATA_KEY],
      data[USER_IDS_DATA_KEY],
      data[QUESTION_ID_DATA_KEY],
    );
  } catch (error) {
    console.log('Failed to get room info!', error);
    return null;
  }
}

export { getRoom, getUserRoomInfo };
