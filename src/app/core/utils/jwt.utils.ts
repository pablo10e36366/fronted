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

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  
  // exp está en segundos, Date.now() en milisegundos
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  
  try {
    // Verificar formato básico del token
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Verificar expiración
    return !isTokenExpired(token);
  } catch {
    return false;
  }
}
