/**
 * @file Entry point for the editor api service.
 */
import { Axios } from 'axios';

import RoomModel from '../models/room_model';

const SUCCESS_CODE = 200;

class RoomService {
  private _axios: Axios;

  public constructor() {
    this._axios = new Axios({
      baseURL: 'http://localhost:9002/room-service/room',
    });
  }

  public async getRoomInfo(roomId: string) {
    try {
      const res = await this._axios.get(`/${roomId}/info`);

      if (res.status != SUCCESS_CODE) {
        return null;
      }

      return new RoomModel(roomId, res.data.userids, res.data.questionId);
    } catch (error) {
      return null;
    }
  }
}

export default RoomService;
