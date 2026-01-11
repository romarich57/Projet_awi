import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserCrudComponent } from './admin-user-crud';
import { UserService } from '@users/user.service';
import { createUserServiceMock } from '@testing/mocks/user-service.mock';
import { UserDto } from '@app/types/user-dto';

describe('AdminUserCrudComponent', () => {
    let component: AdminUserCrudComponent;
    let fixture: ComponentFixture<AdminUserCrudComponent>;
    const mockUser: UserDto = {
        id: 1,
        login: 'test',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'benevole',
        emailVerified: true,
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString()
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminUserCrudComponent],
            providers: [
                { provide: UserService, useValue: createUserServiceMock() }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserCrudComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('user', mockUser);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit roleChanged when role is updated', () => {
        spyOn(component.roleChanged, 'emit');
        const event = { target: { value: 'admin' } } as any;
        component.updateUserRole(event);
        expect(component.roleChanged.emit).toHaveBeenCalledWith({ user: mockUser, role: 'admin' });
    });

    it('should not emit roleChanged if role is same', () => {
        spyOn(component.roleChanged, 'emit');
        const event = { target: { value: 'benevole' } } as any;
        component.updateUserRole(event);
        expect(component.roleChanged.emit).not.toHaveBeenCalled();
    });

    it('should emit userDeleted when delete is called', () => {
        spyOn(component.userDeleted, 'emit');
        const event = { stopPropagation: () => { } } as any;
        component.deleteUser(event);
        expect(component.userDeleted.emit).toHaveBeenCalledWith({ id: mockUser.id, event });
    });
});
