/**
 * @file Defines {@link userServiceApi}.
 */
import { Axios } from 'axios';

/**
 * Get access token public key.
 * @param userServiceApi - The user service api.
 * @returns Public key for verifying access tokens.
 */
async function getAccessTokenPublicKey(
  userServiceApi: string,
): Promise<string> {
  const axios = new Axios({
    baseURL: userServiceApi,
    withCredentials: true,
  });

  return (await axios.get(`/access-token-public-key`)).data;
}

export { getAccessTokenPublicKey };
