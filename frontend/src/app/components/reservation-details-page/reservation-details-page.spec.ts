import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';

import { ReservationDetailsPage } from './reservation-details-page';
import { ZonePlanJeux } from '../zone-plan-jeux/zone-plan-jeux';

// Mock ZonePlanJeux to avoid its required inputs and complex dependencies
@Component({
  selector: 'app-zone-plan-jeux',
  standalone: true,
  template: ''
})
class MockZonePlanJeux {
  festivalId = input.required<number | null>();
  reservation = input<any>(null);
  refreshToken = input<number>(0);
  hasGames = input<boolean>(true);
}

describe('ReservationDetailsPage', () => {
  let component: ReservationDetailsPage;
  let fixture: ComponentFixture<ReservationDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: '1' }, queryParams: {} },
            params: of({ id: '1' })
          }
        }
      ]
    })
      .overrideComponent(ReservationDetailsPage, {
        remove: { imports: [ZonePlanJeux] },
        add: { imports: [MockZonePlanJeux] }
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
