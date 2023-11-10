import jwt, { JwtPayload } from 'jsonwebtoken';

export default class AccessTokenVerifier {
  private static _userIdKey: string = 'user-id';
  private static _userRoleKey: string = 'user-role';
  private static _usernameKey: string = 'username';
  private static _emailAddressKey: string = 'email-address';

  private readonly _publicKey: string;

  public constructor(publicKey: string) {
    this._publicKey = publicKey;
  }

  public verify(accessToken: string): UserProfile {
    let payload: JwtPayload;

    try {
      payload = jwt.verify(accessToken, this._publicKey) as JwtPayload;
    } catch (e) {
      throw new Error('Invalid access token.');
    }

    return {
      userId: payload[AccessTokenVerifier._userIdKey],
      userRole: payload[AccessTokenVerifier._userRoleKey],
      username: payload[AccessTokenVerifier._usernameKey],
      emailAddress: payload[AccessTokenVerifier._emailAddressKey],
    };
  }
}

export interface UserProfile {
  userId: number;
  userRole: string;
  username: string;
  emailAddress: string;
}
