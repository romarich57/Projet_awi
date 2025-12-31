import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonePlanJeux } from './zone-plan-jeux';

describe('ZonePlanJeux', () => {
  let component: ZonePlanJeux;
  let fixture: ComponentFixture<ZonePlanJeux>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanJeux]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZonePlanJeux);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
