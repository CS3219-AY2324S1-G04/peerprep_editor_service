/**
 * @file Room service.
 */
import { Axios } from 'axios';

import RoomModel from '../models/room_model';

const SUCCESS_CODE = 200;
const RES_FAILURE_ERR_MSG = 'Request failed!';

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
  });

  try {
    const res = await axios.get(`/room/${roomId}/info`);

    if (res.status != SUCCESS_CODE) {
      throw new Error(RES_FAILURE_ERR_MSG);
    }

    const data = JSON.parse(res.data).data;

    return new RoomModel(roomId, data['users'], data['questions-id']);
  } catch (error) {
    console.log('Failed to get room info!', error);
    return null;
  }
}

export { getRoom };
