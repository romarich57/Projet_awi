import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileActionsComponent } from './user-profile-actions';

describe('UserProfileActionsComponent', () => {
  let component: UserProfileActionsComponent;
  let fixture: ComponentFixture<UserProfileActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileActionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userEmail', 'user@example.com');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user email', () => {
    expect(component.userEmail()).toBe('user@example.com');
  });

  it('should emit passwordResetRequested when requestPasswordReset is called', () => {
    const spy = spyOn(component.passwordResetRequested, 'emit');
    component.requestPasswordReset();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteRequested when requestDelete is called', () => {
    const spy = spyOn(component.deleteRequested, 'emit');
    component.requestDelete();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteCancelled when cancelDelete is called', () => {
    const spy = spyOn(component.deleteCancelled, 'emit');
    component.cancelDelete();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteConfirmed when confirmDeleteAccount is called', () => {
    const spy = spyOn(component.deleteConfirmed, 'emit');
    component.confirmDeleteAccount();
    expect(spy).toHaveBeenCalled();
  });

  it('should reflect isMutating input', () => {
    expect(component.isMutating()).toBeFalse();
    fixture.componentRef.setInput('isMutating', true);
    fixture.detectChanges();
    expect(component.isMutating()).toBeTrue();
  });

  it('should reflect confirmDelete input', () => {
    expect(component.confirmDelete()).toBeFalse();
    fixture.componentRef.setInput('confirmDelete', true);
    fixture.detectChanges();
    expect(component.confirmDelete()).toBeTrue();
  });
});
