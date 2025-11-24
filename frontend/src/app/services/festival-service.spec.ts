import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FestivalService } from './festival-service';

describe('FestivalService', () => {
  let service: FestivalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FestivalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
