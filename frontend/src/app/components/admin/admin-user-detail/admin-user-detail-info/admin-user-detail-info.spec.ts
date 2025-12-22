import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserDetailInfoComponent } from './admin-user-detail-info';
import { UserDto } from '@app/types/user-dto';
import { UploadService } from '../../../../services/upload.service';

describe('AdminUserDetailInfoComponent', () => {
    let component: AdminUserDetailInfoComponent;
    let fixture: ComponentFixture<AdminUserDetailInfoComponent>;

    const mockUser: UserDto = {
        id: 1,
        login: 'test',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'visiteur',
        emailVerified: true,
        avatarUrl: 'path/to/avatar.png',
        phone: null,
        createdAt: new Date().toISOString()
    };

    const mockUploadService = {
        getAvatarUrl: (url: string) => url,
        isUploading: () => false,
        uploadError: () => null
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminUserDetailInfoComponent],
            providers: [{ provide: UploadService, useValue: mockUploadService }]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserDetailInfoComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('user', mockUser);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display user info', () => {
        const element = fixture.nativeElement;
        expect(element.textContent).toContain('test');
        expect(element.textContent).toContain('Test User');
    });
});
