export type Role = 'admin' | 'manager' | 'owner';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  consorcioId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
