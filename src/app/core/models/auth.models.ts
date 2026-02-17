export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: {
    sub?: number;
    email?: string;
    name?: string;
    role?: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  // role?: 'admin' | 'usuario'; // si lo manejas en backend
}

export interface JwtUserPayload {
  sub?: number;
  id?: number;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
  iat?: number;
}
