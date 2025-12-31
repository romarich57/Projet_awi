import { TestBed } from '@angular/core/testing';

import { ZonePlanService } from './zone-plan-service';

describe('ZonePlanService', () => {
  let service: ZonePlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZonePlanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
