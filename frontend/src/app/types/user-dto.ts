// Type : Decrit les roles utilisateur possibles.
export type UserRole = 'admin' | 'benevole' | 'organizer' | 'super-organizer';

// Valeur : Liste ordonnee des roles utilisateur.
export const USER_ROLES: UserRole[] = [
  'benevole',
  'organizer',
  'super-organizer',
  'admin',
];

// Type : Decrit un utilisateur.
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
