import { TestBed } from '@angular/core/testing';

import { ReservantApi } from './reservant-api';

describe('ReservantApi', () => {
  let service: ReservantApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservantApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
