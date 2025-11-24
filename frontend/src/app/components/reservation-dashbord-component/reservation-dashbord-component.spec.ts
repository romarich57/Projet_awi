import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDashbordComponent } from './reservation-dashbord-component';

describe('ReservationDashbordComponent', () => {
  let component: ReservationDashbordComponent;
  let fixture: ComponentFixture<ReservationDashbordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDashbordComponent]
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
