import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReservantApiService } from './reservant-api';

describe('ReservantApiService', () => {
  let service: ReservantApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservantApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
