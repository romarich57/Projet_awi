import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserDetailPageComponent } from './admin-user-detail-page';
import { UserService } from '@services/user.service';
import { createUserServiceMock } from '@testing/mocks/user-service.mock';
import { UploadService } from '../../../../services/upload.service';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Location } from '@angular/common';

describe('AdminUserDetailPageComponent', () => {
    let component: AdminUserDetailPageComponent;
    let fixture: ComponentFixture<AdminUserDetailPageComponent>;
    let userServiceMock: any;

    const mockUploadService = {
        isUploading: () => false,
        uploadError: () => null,
        getAvatarUrl: (url: string) => url,
        uploadAvatar: () => of('url')
    };

    beforeEach(async () => {
        userServiceMock = createUserServiceMock();

        await TestBed.configureTestingModule({
            imports: [AdminUserDetailPageComponent],
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: userServiceMock },
                { provide: UploadService, useValue: mockUploadService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({ get: (key: string) => '1' }) // Mock ID 1
                    }
                },
                Location
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserDetailPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load user data and find user if exists', () => {
        userServiceMock.users.set([{
            id: 1,
            login: 'test',
            role: 'benevole',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: null,
            avatarUrl: null,
            emailVerified: true,
            createdAt: new Date('2024-01-01').toISOString(),
        }]);

        fixture.detectChanges();
        
        expect(component.user()).toBeTruthy();
        expect(component.user()?.login).toBe('test');
    });

    it('should toggle edit mode', () => {
        userServiceMock.users.set([{
            id: 1,
            login: 'test',
            role: 'benevole',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: null,
            avatarUrl: null,
            emailVerified: true,
            createdAt: new Date('2024-01-01').toISOString(),
        }]);
        fixture.detectChanges();

        expect(component.isEditing()).toBeFalse();
        component.toggleEdit();
        expect(component.isEditing()).toBeTrue();
        component.cancelEdit();
        expect(component.isEditing()).toBeFalse();
    });
});
