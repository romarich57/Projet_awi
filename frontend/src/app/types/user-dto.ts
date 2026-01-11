export type UserRole = 'admin' | 'benevole' | 'organizer' | 'super-organizer';

export const USER_ROLES: UserRole[] = [
  'benevole',
  'organizer',
  'super-organizer',
  'admin',
];

export interface UserDto {
  id: number;
  login: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}
