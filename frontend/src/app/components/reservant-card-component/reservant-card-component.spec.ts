import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservantCardComponent } from './reservant-card-component';

describe('ReservantCardComponent', () => {
  let component: ReservantCardComponent;
  let fixture: ComponentFixture<ReservantCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservantCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservantCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
