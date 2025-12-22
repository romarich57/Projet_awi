import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserProfileEditComponent } from './user-profile-edit';

describe('UserProfileEditComponent', () => {
  let component: UserProfileEditComponent;
  let fixture: ComponentFixture<UserProfileEditComponent>;
  let testForm: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileEditComponent],
    }).compileComponents();

    testForm = new FormGroup({
      login: new FormControl('testuser', { nonNullable: true }),
      firstName: new FormControl('Test', { nonNullable: true }),
      lastName: new FormControl('User', { nonNullable: true }),
      email: new FormControl('test@example.com', { nonNullable: true, validators: [Validators.email] }),
      phone: new FormControl('', { nonNullable: true }),
    });

    fixture = TestBed.createComponent(UserProfileEditComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('editForm', testForm);
    fixture.componentRef.setInput('avatarPreview', '/assets/default-avatar.svg');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to the form', () => {
    expect(component.editForm()).toBe(testForm);
  });

  it('should emit fileSelected when onFileSelected is called', () => {
    const spy = spyOn(component.fileSelected, 'emit');
    const mockEvent = new Event('change');
    component.onFileSelected(mockEvent);
    expect(spy).toHaveBeenCalledWith(mockEvent);
  });

  it('should emit avatarRemoved when removeAvatar is called', () => {
    const spy = spyOn(component.avatarRemoved, 'emit');
    component.removeAvatar();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cancelled when cancel is called', () => {
    const spy = spyOn(component.cancelled, 'emit');
    component.cancel();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit submitted when submit is called', () => {
    const spy = spyOn(component.submitted, 'emit');
    component.submit();
    expect(spy).toHaveBeenCalled();
  });

  it('should reflect isMutating input', () => {
    expect(component.isMutating()).toBeFalse();
    fixture.componentRef.setInput('isMutating', true);
    fixture.detectChanges();
    expect(component.isMutating()).toBeTrue();
  });

  it('should reflect isUploading input', () => {
    expect(component.isUploading()).toBeFalse();
    fixture.componentRef.setInput('isUploading', true);
    fixture.detectChanges();
    expect(component.isUploading()).toBeTrue();
  });

  it('should reflect uploadError input', () => {
    expect(component.uploadError()).toBeNull();
    fixture.componentRef.setInput('uploadError', 'File too large');
    fixture.detectChanges();
    expect(component.uploadError()).toBe('File too large');
  });

  it('should reflect selectedFile input', () => {
    expect(component.selectedFile()).toBeNull();
    const mockFile = new File([''], 'avatar.png', { type: 'image/png' });
    fixture.componentRef.setInput('selectedFile', mockFile);
    fixture.detectChanges();
    expect(component.selectedFile()).toBe(mockFile);
  });

  it('should reflect avatarPreview input', () => {
    expect(component.avatarPreview()).toBe('/assets/default-avatar.svg');
    fixture.componentRef.setInput('avatarPreview', 'data:image/png;base64,abc');
    fixture.detectChanges();
    expect(component.avatarPreview()).toBe('data:image/png;base64,abc');
  });
});
