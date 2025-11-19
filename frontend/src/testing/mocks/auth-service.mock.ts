import { WritableSignal, signal } from '@angular/core';
import { of } from 'rxjs';
import { UserDto } from '@shared/types/user-dto';

export interface AuthServiceMock {
  readonly isLoading: WritableSignal<boolean>;
  readonly error: WritableSignal<string | null>;
  readonly isLoggedIn: WritableSignal<boolean>;
  readonly isAdmin: WritableSignal<boolean>;
  readonly currentUser: WritableSignal<UserDto | null>;
  login: jasmine.Spy;
  logout: jasmine.Spy;
  whoami: jasmine.Spy;
  register: jasmine.Spy;
  verifyEmail: jasmine.Spy;
  resendVerificationEmail: jasmine.Spy;
  requestPasswordReset: jasmine.Spy;
  resetPassword: jasmine.Spy;
  checkSession$: jasmine.Spy;
  refresh$: jasmine.Spy;
}

export function createAuthServiceMock(
  overrides: Partial<AuthServiceMock> = {},
): AuthServiceMock {
  const mock: AuthServiceMock = {
    isLoading: signal(false),
    error: signal<string | null>(null),
    isLoggedIn: signal(false),
    isAdmin: signal(false),
    currentUser: signal<UserDto | null>(null),
    login: jasmine.createSpy('login'),
    logout: jasmine.createSpy('logout'),
    whoami: jasmine.createSpy('whoami'),
    register: jasmine
      .createSpy('register')
      .and.returnValue(of('Compte créé. Veuillez vérifier votre email pour activer votre compte.')),
    verifyEmail: jasmine
      .createSpy('verifyEmail')
      .and.returnValue(of({ message: 'Votre email est vérifié.', user: null })),
    resendVerificationEmail: jasmine
      .createSpy('resendVerificationEmail')
      .and.returnValue(of('Un nouvel email de vérification vient d’être envoyé.')),
    requestPasswordReset: jasmine
      .createSpy('requestPasswordReset')
      .and.returnValue(of('Si un compte existe, un email vient d’être envoyé.')),
    resetPassword: jasmine
      .createSpy('resetPassword')
      .and.returnValue(of('Mot de passe mis à jour.')),
    checkSession$: jasmine.createSpy('checkSession$').and.returnValue(of(null)),
    refresh$: jasmine.createSpy('refresh$').and.returnValue(of(null)),
  }

  return { ...mock, ...overrides }
}
