import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserDetailEditComponent } from './admin-user-detail-edit';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

describe('AdminUserDetailEditComponent', () => {
    let component: AdminUserDetailEditComponent;
    let fixture: ComponentFixture<AdminUserDetailEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminUserDetailEditComponent, ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminUserDetailEditComponent);
        component = fixture.componentInstance;

        const formGroup = new FormGroup({
            login: new FormControl(''),
            firstName: new FormControl(''),
            lastName: new FormControl(''),
            email: new FormControl(''),
            phone: new FormControl(''),
            role: new FormControl('benevole'),
            emailVerified: new FormControl(false)
        });
        fixture.componentRef.setInput('editForm', formGroup);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit fileSelected', () => {
        spyOn(component.fileSelected, 'emit');
        component.onFileSelected({} as any);
        expect(component.fileSelected.emit).toHaveBeenCalled();
    });

    it('should emit submitted', () => {
        spyOn(component.submitted, 'emit');
        component.submit();
        expect(component.submitted.emit).toHaveBeenCalled();
    });
});
