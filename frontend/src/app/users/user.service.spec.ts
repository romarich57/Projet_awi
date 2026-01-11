import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CreateUserPayload, UpdateUserPayload, UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load users with credentials', () => {
    service.loadAll();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });

  it('should create a user and refresh the list', () => {
    const payload: CreateUserPayload = {
      login: 'newuser',
      password: 'SecurePass123',
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      phone: null,
      avatarUrl: null,
      role: 'benevole',
    };

    service.createUser(payload);

    const postReq = httpMock.expectOne('/api/users');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual(payload);
    postReq.flush({ message: 'Utilisateur créé' });

    const refreshReq = httpMock.expectOne('/api/users');
    expect(refreshReq.request.method).toBe('GET');
    refreshReq.flush([]);

    expect(service.mutationStatus()).toBe('success');
  });

  it('should update a user and refresh the list', () => {
    const payload: UpdateUserPayload = {
      login: 'user1',
      firstName: 'User',
      lastName: 'Updated',
      email: 'user1@example.com',
      phone: null,
      avatarUrl: null,
      role: 'benevole',
      emailVerified: true,
    };

    service.updateUser(12, payload);

    const putReq = httpMock.expectOne('/api/users/12');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(payload);
    putReq.flush({ message: 'Utilisateur mis à jour', user: { id: 12 } });

    const refreshReq = httpMock.expectOne('/api/users');
    expect(refreshReq.request.method).toBe('GET');
    refreshReq.flush([]);

    expect(service.mutationStatus()).toBe('success');
  });

  it('should patch the local list when update response has no user', () => {
    service.loadAll();

    const initialReq = httpMock.expectOne('/api/users');
    initialReq.flush([
      {
        id: 12,
        login: 'user12',
        role: 'benevole',
        firstName: 'User',
        lastName: 'Twelve',
        email: 'user12@example.com',
        phone: null,
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date('2024-01-01').toISOString(),
      },
    ]);

    const payload: UpdateUserPayload = { role: 'benevole' };

    service.updateUser(12, payload);

    const putReq = httpMock.expectOne('/api/users/12');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({ message: 'Utilisateur mis à jour' });

    expect(service.users()[0].role).toBe('benevole');

    const refreshReq = httpMock.expectOne('/api/users');
    refreshReq.flush([
      {
        id: 12,
        login: 'user12',
        role: 'benevole',
        firstName: 'User',
        lastName: 'Twelve',
        email: 'user12@example.com',
        phone: null,
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date('2024-01-01').toISOString(),
      },
    ]);
  });

  it('should delete a user and refresh the list', () => {
    service.deleteUser(4);

    const deleteReq = httpMock.expectOne('/api/users/4');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ message: 'Utilisateur supprimé' });

    const refreshReq = httpMock.expectOne('/api/users');
    expect(refreshReq.request.method).toBe('GET');
    refreshReq.flush([]);

    expect(service.mutationStatus()).toBe('success');
  });
});
