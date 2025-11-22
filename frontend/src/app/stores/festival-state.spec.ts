import { TestBed } from '@angular/core/testing';

import { FestivalState } from './festival-state';

describe('FestivalState', () => {
  let service: FestivalState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FestivalState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
