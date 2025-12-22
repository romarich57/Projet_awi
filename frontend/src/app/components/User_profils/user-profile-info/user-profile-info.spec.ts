import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileInfoComponent } from './user-profile-info';
import { provideRouter } from '@angular/router';
import { UploadService, DEFAULT_AVATAR_URL } from '@services/upload.service';
import { UserDto } from '@app/types/user-dto';

describe('UserProfileInfoComponent', () => {
  let component: UserProfileInfoComponent;
  let fixture: ComponentFixture<UserProfileInfoComponent>;

  const mockUploadService = {
    getAvatarUrl: jasmine.createSpy('getAvatarUrl').and.callFake((url: string) => `http://api${url}`),
  };

  const testUser: UserDto = {
    id: 1,
    login: 'profileuser',
    role: 'visiteur',
    firstName: 'Profile',
    lastName: 'User',
    email: 'profile@example.com',
    phone: '+33123456789',
    avatarUrl: '/uploads/avatars/avatar.png',
    emailVerified: true,
    createdAt: new Date('2024-02-01').toISOString(),
  };

  beforeEach(async () => {
    mockUploadService.getAvatarUrl.calls.reset();

    await TestBed.configureTestingModule({
      imports: [UserProfileInfoComponent],
      providers: [
        provideRouter([]),
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', testUser);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user data from input', () => {
    expect(component.user().login).toBe('profileuser');
    expect(component.user().email).toBe('profile@example.com');
    expect(component.user().firstName).toBe('Profile');
    expect(component.user().lastName).toBe('User');
  });

  it('should have role labels defined', () => {
    expect(component.roleLabels['visiteur']).toBe('Visiteur');
    expect(component.roleLabels['admin']).toBe('Admin');
    expect(component.roleLabels['organizer']).toBe('Organisateur');
    expect(component.roleLabels['super-organizer']).toBe('Super-organisateur');
    expect(component.roleLabels['benevole']).toBe('Benevole');
  });

  it('should return avatar URL using upload service', () => {
    const result = component.getAvatarUrl('/uploads/avatars/avatar.png');
    expect(mockUploadService.getAvatarUrl).toHaveBeenCalledWith('/uploads/avatars/avatar.png');
    expect(result).toBe('http://api/uploads/avatars/avatar.png');
  });

  it('should return default avatar URL when avatarUrl is null', () => {
    const result = component.getAvatarUrl(null);
    expect(result).toBe(DEFAULT_AVATAR_URL);
  });

  it('should return default avatar URL when avatarUrl is undefined', () => {
    const result = component.getAvatarUrl(undefined);
    expect(result).toBe(DEFAULT_AVATAR_URL);
  });

  it('should display phone when available', () => {
    expect(component.user().phone).toBe('+33123456789');
  });

  it('should handle user without phone', () => {
    const userWithoutPhone = { ...testUser, phone: null };
    fixture.componentRef.setInput('user', userWithoutPhone);
    fixture.detectChanges();
    expect(component.user().phone).toBeNull();
  });

  it('should show verified status', () => {
    expect(component.user().emailVerified).toBeTrue();
  });

  it('should handle unverified email', () => {
    const unverifiedUser = { ...testUser, emailVerified: false };
    fixture.componentRef.setInput('user', unverifiedUser);
    fixture.detectChanges();
    expect(component.user().emailVerified).toBeFalse();
  });
});
