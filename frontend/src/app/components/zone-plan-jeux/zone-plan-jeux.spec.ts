import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ZonePlanJeux } from './zone-plan-jeux';

describe('ZonePlanJeux', () => {
  let component: ZonePlanJeux;
  let fixture: ComponentFixture<ZonePlanJeux>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanJeux],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonePlanJeux);
    component = fixture.componentInstance;
    // Provide the required festivalId input
    fixture.componentRef.setInput('festivalId', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
