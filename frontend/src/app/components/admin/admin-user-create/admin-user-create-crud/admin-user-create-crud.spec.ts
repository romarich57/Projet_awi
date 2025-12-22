import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserCreateCrudComponent } from './admin-user-create-crud';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

describe('AdminUserCreateCrudComponent', () => {
    let component: AdminUserCreateCrudComponent;
    let fixture: ComponentFixture<AdminUserCreateCrudComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminUserCreateCrudComponent, ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserCreateCrudComponent);
        component = fixture.componentInstance;

        // Setup required inputs
        const formGroup = new FormGroup({
            login: new FormControl(''),
            password: new FormControl(''),
            firstName: new FormControl(''),
            lastName: new FormControl(''),
            email: new FormControl(''),
            phone: new FormControl(''),
            role: new FormControl('visiteur')
        });
        fixture.componentRef.setInput('createForm', formGroup);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit fileSelected event', () => {
        spyOn(component.fileSelected, 'emit');
        const event = { target: { files: [] } };
        component.onFileSelected(event as any);
        expect(component.fileSelected.emit).toHaveBeenCalledWith(event as any);
    });

    it('should emit removeAvatar event', () => {
        spyOn(component.avatarRemoved, 'emit');
        component.removeAvatar();
        expect(component.avatarRemoved.emit).toHaveBeenCalled();
    });

    it('should emit submitted event', () => {
        spyOn(component.formSubmitted, 'emit');
        component.submit();
        expect(component.formSubmitted.emit).toHaveBeenCalled();
    });
});
