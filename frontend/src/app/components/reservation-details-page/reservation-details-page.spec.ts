import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ReservationDetailsPage } from './reservation-details-page';

describe('ReservationDetailsPage', () => {
  let component: ReservationDetailsPage;
  let fixture: ComponentFixture<ReservationDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailsPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: '1' } },
            params: of({ id: '1' })
          }
        }
      ]
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
