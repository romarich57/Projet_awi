import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserCreateFormComponent } from './admin-user-create-form';
import { UserService } from '@users/user.service';
import { createUserServiceMock } from '@testing/mocks/user-service.mock';
import { UploadService } from '../../../../services/upload.service'; // Adjust path if needed or use aliases if setup

import { provideRouter } from '@angular/router';
import { Location } from '@angular/common';

// Define a simple mock for UploadService if not available globally
const uploadServiceMock = {
    isUploading: jasmine.createSpy('isUploading').and.returnValue(function () { return false; }),
    uploadError: jasmine.createSpy('uploadError').and.returnValue(function () { return null; }),
    uploadAvatar: jasmine.createSpy('uploadAvatar').and.returnValue({ subscribe: (fn: any) => fn('http://avatar.url') }),
    getAvatarUrl: jasmine.createSpy('getAvatarUrl').and.callFake((url: string) => url)
};
// Fix signal inputs for mock
Object.defineProperty(uploadServiceMock, 'isUploading', { value: jasmine.createSpy().and.returnValue(() => false), writable: true });
Object.defineProperty(uploadServiceMock, 'uploadError', { value: { set: jasmine.createSpy() }, writable: true });


describe('AdminUserCreateFormComponent', () => {
    let component: AdminUserCreateFormComponent;
    let fixture: ComponentFixture<AdminUserCreateFormComponent>;
    let userServiceMock: any;
    let locationSpy: jasmine.SpyObj<Location>;

    beforeEach(async () => {
        userServiceMock = createUserServiceMock();
        locationSpy = jasmine.createSpyObj('Location', ['back']);

        // Mock proper signals for UploadService
        const uploadErrorSpy = jasmine.createSpy('uploadError').and.returnValue(null);
        (uploadErrorSpy as any).set = jasmine.createSpy('set');

        const isUploadingSpy = jasmine.createSpy('isUploading').and.returnValue(false);
        (isUploadingSpy as any).set = jasmine.createSpy('set');

        const mockUploadService = {
            isUploading: isUploadingSpy,
            uploadError: uploadErrorSpy,
            uploadAvatar: jasmine.createSpy().and.returnValue({ subscribe: (cb: any) => cb('http://url') }),
            getAvatarUrl: (url: string) => url
        };

        await TestBed.configureTestingModule({
            imports: [AdminUserCreateFormComponent],
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: userServiceMock },
                { provide: UploadService, useValue: mockUploadService },
                { provide: Location, useValue: locationSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserCreateFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should validate form', () => {
        expect(component.createForm.valid).toBeFalse();
        component.createForm.controls['login'].setValue('test');
        component.createForm.controls['password'].setValue('password123');
        component.createForm.controls['firstName'].setValue('First');
        component.createForm.controls['lastName'].setValue('Last');
        component.createForm.controls['email'].setValue('test@example.com');
        component.createForm.controls['role'].setValue('benevole');
        expect(component.createForm.valid).toBeTrue();
    });

    it('should call createUser on submit valid form', () => {
        component.createForm.setValue({
            login: 'user',
            password: 'password123',
            firstName: 'First',
            lastName: 'Last',
            email: 'email@test.com',
            phone: '',
            role: 'benevole'
        });

        component.submit();
        expect(userServiceMock.createUser).toHaveBeenCalled();
    });
});
