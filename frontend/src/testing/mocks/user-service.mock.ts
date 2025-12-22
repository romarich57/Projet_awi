import { WritableSignal, signal } from '@angular/core';
import { UserDto } from '@app/types/user-dto';

export interface UserServiceMock {
  readonly users: WritableSignal<UserDto[]>;
  readonly isLoading: WritableSignal<boolean>;
  readonly error: WritableSignal<string | null>;
  readonly isMutating: WritableSignal<boolean>;
  readonly mutationMessage: WritableSignal<string | null>;
  readonly mutationStatus: WritableSignal<'success' | 'error' | null>;
  loadAll: jasmine.Spy;
  deleteUser: jasmine.Spy;
  createUser: jasmine.Spy;
  updateUser: jasmine.Spy;
}

export function createUserServiceMock(
  overrides: Partial<UserServiceMock> = {},
): UserServiceMock {
  const mock: UserServiceMock = {
    users: signal<UserDto[]>([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    isMutating: signal(false),
    mutationMessage: signal<string | null>(null),
    mutationStatus: signal<'success' | 'error' | null>(null),
    loadAll: jasmine.createSpy('loadAll'),
    deleteUser: jasmine.createSpy('deleteUser'),
    createUser: jasmine.createSpy('createUser'),
    updateUser: jasmine.createSpy('updateUser'),
  }

  return { ...mock, ...overrides }
}
