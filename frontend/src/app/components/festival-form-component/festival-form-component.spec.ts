import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FestivalFormComponent } from './festival-form-component';

describe('FestivalFormComponent', () => {
  let component: FestivalFormComponent;
  let fixture: ComponentFixture<FestivalFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
