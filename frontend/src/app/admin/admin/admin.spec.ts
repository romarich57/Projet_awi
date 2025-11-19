import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserService } from '@users/user.service';
import { createUserServiceMock } from '@testing/mocks/user-service.mock';
import { AdminComponent } from './admin';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [{ provide: UserService, useValue: createUserServiceMock() }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
