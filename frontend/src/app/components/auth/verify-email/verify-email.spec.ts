import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@services/auth.service';
import { createAuthServiceMock } from '@testing/mocks/auth-service.mock';
import { VerifyEmailComponent } from './verify-email';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  const activatedRouteStub: Partial<ActivatedRoute> = {
    snapshot: {
      queryParamMap: {
        get: () => null,
      },
    } as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: createAuthServiceMock() },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
