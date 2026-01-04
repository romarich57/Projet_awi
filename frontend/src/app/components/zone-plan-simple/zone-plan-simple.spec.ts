import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonePlanSimple } from './zone-plan-simple';

describe('ZonePlanSimple', () => {
  let component: ZonePlanSimple;
  let fixture: ComponentFixture<ZonePlanSimple>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanSimple]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZonePlanSimple);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
