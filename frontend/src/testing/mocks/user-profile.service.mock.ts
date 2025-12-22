import { WritableSignal, signal } from '@angular/core';

export interface UserProfileServiceMock {
  readonly isMutating: WritableSignal<boolean>;
  readonly mutationMessage: WritableSignal<string | null>;
  readonly mutationStatus: WritableSignal<'success' | 'error' | null>;
  readonly lastAction: WritableSignal<'update' | 'delete' | 'reset' | null>;
  updateProfile: jasmine.Spy;
  requestPasswordReset: jasmine.Spy;
  deleteAccount: jasmine.Spy;
}

export function createUserProfileServiceMock(
  overrides: Partial<UserProfileServiceMock> = {},
): UserProfileServiceMock {
  const mock: UserProfileServiceMock = {
    isMutating: signal(false),
    mutationMessage: signal<string | null>(null),
    mutationStatus: signal<'success' | 'error' | null>(null),
    lastAction: signal<'update' | 'delete' | 'reset' | null>(null),
    updateProfile: jasmine.createSpy('updateProfile'),
    requestPasswordReset: jasmine.createSpy('requestPasswordReset'),
    deleteAccount: jasmine.createSpy('deleteAccount'),
  };

  return { ...mock, ...overrides };
}
