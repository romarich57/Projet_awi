import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { ReservationDashbordComponent } from './reservation-dashbord-component';
import { AuthService } from '../../services/auth.service';

describe('ReservationDashbordComponent', () => {
  let component: ReservationDashbordComponent;
  let fixture: ComponentFixture<ReservationDashbordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDashbordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { isSuperOrganizer: signal(true) } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDashbordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
