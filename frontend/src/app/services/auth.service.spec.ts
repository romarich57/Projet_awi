import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';
import { UserDto } from '@app/types/user-dto';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let routerSpy: jasmine.SpyObj<Router>;

    const mockUser: UserDto = {
        id: 1,
        login: 'testuser',
        email: 'test@example.com',
        role: 'benevole',
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        phone: null,
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
    };

    const mockAdminUser = {
        ...mockUser,
        id: 2,
        login: 'admin',
        role: 'admin' as const,
    };

    const mockOrganizerUser = {
        ...mockUser,
        id: 3,
        login: 'organizer',
        role: 'organizer' as const,
    };

    const mockSuperOrganizerUser = {
        ...mockUser,
        id: 4,
        login: 'super-organizer',
        role: 'super-organizer' as const,
    };

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/dashboard' });

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy },
            ],
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Initial State', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should have null currentUser initially', () => {
            expect(service.currentUser()).toBeNull();
        });

        it('should have isLoggedIn as false initially', () => {
            expect(service.isLoggedIn()).toBeFalse();
        });

        it('should have isAdmin as false initially', () => {
            expect(service.isAdmin()).toBeFalse();
        });

        it('should have isLoading as false initially', () => {
            expect(service.isLoading()).toBeFalse();
        });

        it('should have error as null initially', () => {
            expect(service.error()).toBeNull();
        });

        it('should have isOrganizer as false initially', () => {
            expect(service.isOrganizer()).toBeFalse();
        });

        it('should have isSuperOrganizer as false initially', () => {
            expect(service.isSuperOrganizer()).toBeFalse();
        });
    });

    describe('login()', () => {
        it('should set currentUser on successful login', fakeAsync(() => {
            service.login('testuser', 'password123');

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ identifier: 'testuser', password: 'password123' });
            expect(req.request.withCredentials).toBeTrue();

            req.flush({ user: mockUser });
            tick();

            expect(service.currentUser()).toEqual(jasmine.objectContaining({ id: mockUser.id, login: mockUser.login }));
            expect(service.isLoggedIn()).toBeTrue();
            expect(service.isLoading()).toBeFalse();
            expect(service.error()).toBeNull();
        }));

        it('should set isLoading to true during login', fakeAsync(() => {
            service.login('testuser', 'password123');
            expect(service.isLoading()).toBeTrue();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({ user: mockUser });
            tick();

            expect(service.isLoading()).toBeFalse();
        }));

        it('should set error when login fails with invalid credentials', fakeAsync(() => {
            service.login('testuser', 'wrongpassword');

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({ error: 'Identifiants invalides' }, { status: 401, statusText: 'Unauthorized' });
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.isLoggedIn()).toBeFalse();
            expect(service.error()).toBe('Identifiants invalides');
        }));

        it('should set error when response has no user', fakeAsync(() => {
            service.login('testuser', 'password123');

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({});
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.error()).toBe('Identifiants invalides');
        }));

        it('should handle network error', fakeAsync(() => {
            service.login('testuser', 'password123');

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.error(new ProgressEvent('error'), { status: 0, statusText: 'Network Error' });
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.error()).toBe('Serveur injoignable (vérifiez HTTPS ou CORS)');
        }));
    });

    describe('logout()', () => {
        it('should clear currentUser and redirect to login on successful logout', fakeAsync(() => {
            // Simulate logged in state first
            service.login('testuser', 'password123');
            const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            loginReq.flush({ user: mockUser });
            tick();

            expect(service.currentUser()).toEqual(jasmine.objectContaining({ id: mockUser.id }));

            // Now logout
            service.logout();

            const logoutReq = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
            expect(logoutReq.request.method).toBe('POST');
            expect(logoutReq.request.withCredentials).toBeTrue();

            logoutReq.flush({});
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.isLoggedIn()).toBeFalse();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        }));

        it('should clear currentUser and redirect even on logout error', fakeAsync(() => {
            service.logout();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
            req.flush({}, { status: 500, statusText: 'Server Error' });
            tick();

            expect(service.currentUser()).toBeNull();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        }));
    });

    describe('checkSession$()', () => {
        it('should set currentUser on valid session', fakeAsync(() => {
            service.checkSession$().subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/whoami`);
            expect(req.request.method).toBe('GET');
            expect(req.request.withCredentials).toBeTrue();

            req.flush({ user: mockUser });
            tick();

            expect(service.currentUser()).toEqual(jasmine.objectContaining({ id: mockUser.id }));
        }));

        it('should clear currentUser on 401 response', fakeAsync(() => {
            service.checkSession$().subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/whoami`);
            req.flush({}, { status: 401, statusText: 'Unauthorized' });
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.error()).toBeNull(); // 401 should not set error
        }));

        it('should set error on network failure', fakeAsync(() => {
            service.checkSession$().subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/whoami`);
            req.error(new ProgressEvent('error'), { status: 0, statusText: 'Network Error' });
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.error()).toBe('Serveur injoignable (vérifiez HTTPS ou CORS)');
        }));

        it('should set error on other server errors', fakeAsync(() => {
            service.checkSession$().subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/whoami`);
            req.flush({}, { status: 500, statusText: 'Server Error' });
            tick();

            expect(service.currentUser()).toBeNull();
            expect(service.error()).toBe('Erreur serveur (500)');
        }));
    });

    describe('whoami()', () => {
        it('should call checkSession$', fakeAsync(() => {
            spyOn(service, 'checkSession$').and.callThrough();
            service.whoami();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/whoami`);
            req.flush({ user: mockUser });
            tick();

            expect(service.checkSession$).toHaveBeenCalled();
        }));
    });

    describe('refresh$()', () => {
        it('should call refresh endpoint', fakeAsync(() => {
            service.refresh$().subscribe();

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
            expect(req.request.method).toBe('POST');
            expect(req.request.withCredentials).toBeTrue();

            req.flush({});
            tick();
        }));

        it('should return null on error without throwing', fakeAsync(() => {
            let result: any;
            service.refresh$().subscribe(res => result = res);

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
            req.flush({}, { status: 401, statusText: 'Unauthorized' });
            tick();

            expect(result).toBeNull();
        }));
    });

    describe('register()', () => {
        const registerPayload = {
            login: 'newuser',
            email: 'new@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
        };

        it('should return success message on successful registration', fakeAsync(() => {
            let result: string | undefined;
            service.register(registerPayload).subscribe(msg => result = msg);

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(registerPayload);

            req.flush({ message: 'Inscription réussie' });
            tick();

            expect(result).toBe('Inscription réussie');
        }));

        it('should throw error on registration failure', fakeAsync(() => {
            let error: Error | undefined;
            service.register(registerPayload).subscribe({
                error: err => error = err,
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
            req.flush({ error: 'Email déjà utilisé' }, { status: 400, statusText: 'Bad Request' });
            tick();

            expect(error?.message).toBe('Email déjà utilisé');
        }));
    });

    describe('verifyEmail()', () => {
        it('should verify email with token', fakeAsync(() => {
            let result: any;
            service.verifyEmail('valid-token').subscribe(res => result = res);

            const req = httpMock.expectOne(req => req.url.includes('/auth/verify-email'));
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('token')).toBe('valid-token');

            req.flush({ message: 'Email vérifié' });
            tick();

            expect(result).toEqual({ message: 'Email vérifié' });
        }));

        it('should throw error on invalid token', fakeAsync(() => {
            let error: Error | undefined;
            service.verifyEmail('invalid-token').subscribe({
                error: err => error = err,
            });

            const req = httpMock.expectOne(req => req.url.includes('/auth/verify-email'));
            req.flush({ error: 'Token invalide' }, { status: 400, statusText: 'Bad Request' });
            tick();

            expect(error?.message).toBe('Token invalide');
        }));
    });

    describe('resendVerificationEmail()', () => {
        it('should resend verification email', fakeAsync(() => {
            let result: string | undefined;
            service.resendVerificationEmail('test@example.com').subscribe(msg => result = msg);

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-verification`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ email: 'test@example.com' });

            req.flush({ message: 'Email envoyé' });
            tick();

            expect(result).toBe('Email envoyé');
        }));

        it('should throw error on failure', fakeAsync(() => {
            let error: Error | undefined;
            service.resendVerificationEmail('notfound@example.com').subscribe({
                error: err => error = err,
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-verification`);
            req.flush({ error: 'Email non trouvé' }, { status: 404, statusText: 'Not Found' });
            tick();

            expect(error?.message).toBe('Email non trouvé');
        }));
    });

    describe('requestPasswordReset()', () => {
        it('should request password reset', fakeAsync(() => {
            let result: string | undefined;
            service.requestPasswordReset('test@example.com').subscribe(msg => result = msg);

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/password/forgot`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ email: 'test@example.com' });

            req.flush({ message: 'Email de réinitialisation envoyé' });
            tick();

            expect(result).toBe('Email de réinitialisation envoyé');
        }));
    });

    describe('resetPassword()', () => {
        const resetPayload = {
            token: 'reset-token',
            password: 'newpassword123',
        };

        it('should reset password', fakeAsync(() => {
            let result: string | undefined;
            service.resetPassword(resetPayload).subscribe(msg => result = msg);

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/password/reset`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(resetPayload);

            req.flush({ message: 'Mot de passe réinitialisé' });
            tick();

            expect(result).toBe('Mot de passe réinitialisé');
        }));

        it('should throw error on invalid token', fakeAsync(() => {
            let error: Error | undefined;
            service.resetPassword(resetPayload).subscribe({
                error: err => error = err,
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/auth/password/reset`);
            req.flush({ error: 'Token expiré' }, { status: 400, statusText: 'Bad Request' });
            tick();

            expect(error?.message).toBe('Token expiré');
        }));
    });

    describe('Role-based computed signals', () => {
        it('should set isAdmin to true for admin user', fakeAsync(() => {
            service.login('admin', 'password');
            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({ user: mockAdminUser });
            tick();

            expect(service.isAdmin()).toBeTrue();
            expect(service.isOrganizer()).toBeTrue();
            expect(service.isSuperOrganizer()).toBeTrue();
        }));

        it('should set isOrganizer to true for organizer user', fakeAsync(() => {
            service.login('organizer', 'password');
            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({ user: mockOrganizerUser });
            tick();

            expect(service.isAdmin()).toBeFalse();
            expect(service.isOrganizer()).toBeTrue();
            expect(service.isSuperOrganizer()).toBeFalse();
        }));

        it('should set isSuperOrganizer to true for super-organizer user', fakeAsync(() => {
            service.login('super-organizer', 'password');
            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({ user: mockSuperOrganizerUser });
            tick();

            expect(service.isAdmin()).toBeFalse();
            expect(service.isOrganizer()).toBeTrue();
            expect(service.isSuperOrganizer()).toBeTrue();
        }));

        it('should set all role flags to false for normal user', fakeAsync(() => {
            service.login('user', 'password');
            const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
            req.flush({ user: mockUser });
            tick();

            expect(service.isAdmin()).toBeFalse();
            expect(service.isOrganizer()).toBeFalse();
            expect(service.isSuperOrganizer()).toBeFalse();
        }));
    });

    describe('redirectToLogin', () => {
        it('should not redirect if already on login page', fakeAsync(() => {
            // Change router url mock to /login
            (Object.getOwnPropertyDescriptor(routerSpy, 'url')?.get as jasmine.Spy).and.returnValue('/login');

            service.logout();
            const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
            req.flush({});
            tick();

            expect(routerSpy.navigate).not.toHaveBeenCalled();
        }));
    });
});
