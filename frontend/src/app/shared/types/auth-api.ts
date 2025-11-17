import { UserDto } from './user-dto';

export interface AuthLoginResponse {
  message: string;
  user: UserDto;
}

export interface RegisterPayload {
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  user: UserDto;
}

export interface MessageResponse {
  message: string;
}

export interface EmailPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}
