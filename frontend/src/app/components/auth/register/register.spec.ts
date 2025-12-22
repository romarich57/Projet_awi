import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@services/auth.service';
import { createAuthServiceMock } from '@testing/mocks/auth-service.mock';
import { RegisterComponent } from './register';
import { UploadService } from '../../../services/upload.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: createAuthServiceMock() },
        { provide: UploadService, useValue: { isUploading: Object.assign(() => false, { set: () => { } }), uploadError: Object.assign(() => null, { set: () => { } }), uploadAvatar: () => ({ subscribe: (fn: any) => fn('url') }) } }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
