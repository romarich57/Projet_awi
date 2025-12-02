import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDetailsPage } from './reservation-details-page';

describe('ReservationDetailsPage', () => {
  let component: ReservationDetailsPage;
  let fixture: ComponentFixture<ReservationDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
