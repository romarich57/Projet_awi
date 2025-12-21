export type UserRole = 'admin' | 'visiteur' | 'benevole' | 'organizer' | 'super-organizer';

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
