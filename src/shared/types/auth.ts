export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  portalAccess?: string[];
  tenantId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  portalAccess: string[];
  tenantId?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface UserSession {
  token: string;
  user: AuthUser;
}
