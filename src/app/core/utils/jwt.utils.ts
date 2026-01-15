import { JwtUserPayload } from '../models/auth.models';

export function decodeJwtPayload(token: string): JwtUserPayload | null {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}
