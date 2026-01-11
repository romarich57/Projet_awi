import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserService } from '@users/user.service';
import { createUserServiceMock, UserServiceMock } from '@testing/mocks/user-service.mock';
import { AdminUserListComponent } from './admin-user-list';
import { UserDto } from '@app/types/user-dto';

describe('AdminUserListComponent', () => {
    let component: AdminUserListComponent;
    let fixture: ComponentFixture<AdminUserListComponent>;
    let userServiceMock: UserServiceMock;

    const sampleUsers: UserDto[] = [
        {
            id: 1,
            login: 'alice',
            role: 'benevole',
            firstName: 'Alice',
            lastName: 'Martin',
            email: 'alice@example.com',
            phone: null,
            avatarUrl: null,
            emailVerified: true,
            createdAt: new Date('2024-01-01').toISOString(),
        },
        {
            id: 2,
            login: 'admin',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'Root',
            email: 'admin@example.com',
            phone: null,
            avatarUrl: null,
            emailVerified: false,
            createdAt: new Date('2024-02-01').toISOString(),
        },
    ];

    beforeEach(async () => {
        userServiceMock = createUserServiceMock();
        await TestBed.configureTestingModule({
            imports: [AdminUserListComponent],
            providers: [provideRouter([]), { provide: UserService, useValue: userServiceMock }],
        })
            .compileComponents();

        fixture = TestBed.createComponent(AdminUserListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load users on init', () => {
        expect(userServiceMock.loadAll).toHaveBeenCalled();
    });

    it('should filter users by role', () => {
        userServiceMock.users.set(sampleUsers);
        component.roleFilter.set('admin');

        const filtered = component.filteredUsers();

        expect(filtered.length).toBe(1);
        expect(filtered[0].role).toBe('admin');
    });

    it('should update user role via onRoleChanged', () => {
        userServiceMock.users.set(sampleUsers);

        component.onRoleChanged({ user: sampleUsers[0], role: 'benevole' });

        expect(userServiceMock.updateUser).toHaveBeenCalledWith(1, { role: 'benevole' });
        expect(component.pendingRoles()[sampleUsers[0].id]).toBe('benevole');
    });

    it('should delete user via onUserDeleted', () => {
        userServiceMock.users.set(sampleUsers);

        component.onUserDeleted({ id: 1 });

        expect(userServiceMock.deleteUser).toHaveBeenCalledWith(1);
    });
});
