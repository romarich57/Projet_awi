import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ZonePlanForm } from './zone-plan-form';

describe('ZonePlanForm', () => {
  let component: ZonePlanForm;
  let fixture: ComponentFixture<ZonePlanForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonePlanForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
