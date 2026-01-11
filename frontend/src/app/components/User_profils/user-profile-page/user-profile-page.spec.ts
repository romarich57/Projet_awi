import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { UserProfilePageComponent } from './user-profile-page';
import { AuthService } from '@services/auth.service';
import { createAuthServiceMock, AuthServiceMock } from '@testing/mocks/auth-service.mock';
import { UserProfileService } from '@services/user-profile.service';
import { createUserProfileServiceMock, UserProfileServiceMock } from '@testing/mocks/user-profile.service.mock';
import { UploadService } from '@services/upload.service';
import { of } from 'rxjs';

describe('UserProfilePageComponent', () => {
  let component: UserProfilePageComponent;
  let fixture: ComponentFixture<UserProfilePageComponent>;
  let authMock: AuthServiceMock;
  let profileMock: UserProfileServiceMock;

  const uploadServiceMock = {
    isUploading: signal(false),
    uploadError: signal<string | null>(null),
    getAvatarUrl: (url: string) => url,
    uploadAvatar: () => of(null),
  };

  beforeEach(async () => {
    authMock = createAuthServiceMock({
      currentUser: signal({
        id: 2,
        login: 'profileuser',
        role: 'benevole',
        firstName: 'Profile',
        lastName: 'User',
        email: 'profile@example.com',
        phone: null,
        avatarUrl: null,
        emailVerified: true,
        createdAt: new Date('2024-01-01').toISOString(),
      }),
      isLoggedIn: signal(true),
    });
    profileMock = createUserProfileServiceMock();

    await TestBed.configureTestingModule({
      imports: [UserProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: UserProfileService, useValue: profileMock },
        { provide: UploadService, useValue: uploadServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle edit mode', () => {
    expect(component.isEditing()).toBeFalse();
    component.toggleEdit();
    expect(component.isEditing()).toBeTrue();
    component.cancelEdit();
    expect(component.isEditing()).toBeFalse();
  });

  it('should request password reset', () => {
    component.requestPasswordReset();
    expect(profileMock.requestPasswordReset).toHaveBeenCalledWith('profile@example.com');
  });
});
