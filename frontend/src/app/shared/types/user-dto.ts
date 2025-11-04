export type UserRole = 'admin' | 'user';

export interface UserDto {
  id?: number;
  login: string;
  role: UserRole;
}

