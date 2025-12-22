import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@services/auth.service';
import { createAuthServiceMock } from '@testing/mocks/auth-service.mock';
import { ResendVerificationComponent } from './resend-verification';

describe('ResendVerificationComponent', () => {
  let component: ResendVerificationComponent;
  let fixture: ComponentFixture<ResendVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResendVerificationComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: createAuthServiceMock() }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResendVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
