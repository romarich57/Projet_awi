import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ZonePlanService } from './zone-plan-service';

describe('ZonePlanService', () => {
  let service: ZonePlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ZonePlanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
