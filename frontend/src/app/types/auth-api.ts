import { UserDto } from './user-dto';

// Type : Decrit la reponse de connexion.
export interface AuthLoginResponse {
  message: string;
  user: UserDto;
}

// Type : Decrit le payload d'inscription.
export interface RegisterPayload {
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

// Type : Decrit la reponse d'inscription.
export interface RegisterResponse {
  message: string;
}

// Type : Decrit la reponse de verification d'email.
export interface VerifyEmailResponse {
  message: string;
  user: UserDto;
}

// Type : Decrit une reponse generique avec message.
export interface MessageResponse {
  message: string;
}

// Type : Decrit un payload contenant un email.
export interface EmailPayload {
  email: string;
}

// Type : Decrit le payload de reinitialisation du mot de passe.
export interface ResetPasswordPayload {
  token: string;
  password: string;
}
