import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserProfileService } from '@services/user-profile.service';
import { AuthService } from '@services/auth.service';
import { createAuthServiceMock, AuthServiceMock } from '@testing/mocks/auth-service.mock';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let httpMock: HttpTestingController;
  let authMock: AuthServiceMock;

  beforeEach(() => {
    authMock = createAuthServiceMock();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authMock }],
    });
    service = TestBed.inject(UserProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should update profile and refresh session', () => {
    service.updateProfile({ login: 'newlogin' });

    const req = httpMock.expectOne('/api/users/me');
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Profil mis à jour.', user: { id: 1 } });

    expect(service.mutationStatus()).toBe('success');
    expect(authMock.checkSession$).toHaveBeenCalled();
  });

  it('should request a password reset for the user email', () => {
    service.requestPasswordReset('user@example.com');

    expect(authMock.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
    expect(service.mutationStatus()).toBe('success');
  });

  it('should delete account and logout', () => {
    service.deleteAccount();

    const req = httpMock.expectOne('/api/users/me');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Compte supprimé.' });

    expect(service.mutationStatus()).toBe('success');
    expect(authMock.logout).toHaveBeenCalled();
  });
});
