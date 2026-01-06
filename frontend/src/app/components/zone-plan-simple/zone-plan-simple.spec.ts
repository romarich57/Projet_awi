import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ZonePlanSimple } from './zone-plan-simple';

describe('ZonePlanSimple', () => {
  let component: ZonePlanSimple;
  let fixture: ComponentFixture<ZonePlanSimple>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanSimple],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonePlanSimple);
    component = fixture.componentInstance;
    // Provide the required festivalId input
    fixture.componentRef.setInput('festivalId', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
