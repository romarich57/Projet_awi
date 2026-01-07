import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FestivalCardComponent } from './festival-card-component';
import { FestivalDto } from '../../types/festival-dto';
import { FestivalState } from '../../stores/festival-state';

describe('FestivalCardComponent', () => {
  let component: FestivalCardComponent;
  let fixture: ComponentFixture<FestivalCardComponent>;
  let festivalState: FestivalState;
  let mockFestival: FestivalDto;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalCardComponent);
    component = fixture.componentInstance;
    festivalState = TestBed.inject(FestivalState);
    mockFestival = {
      id: 1,
      name: 'Test Fest',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-02'),
      stock_tables_standard: 10,
      stock_tables_grande: 5,
      stock_tables_mairie: 2,
      stock_chaises: 50,
    };
    fixture.componentRef.setInput('festival', mockFestival);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the selected festival on click', () => {
    const emitted: Array<number | null> = [];
    component.select.subscribe((value) => emitted.push(value));

    component.onFestivalClick();
    expect(festivalState.currentFestival()?.id).toBe(mockFestival.id);
    expect(emitted[emitted.length - 1]).toBe(mockFestival.id);

    component.onFestivalClick();
    expect(festivalState.currentFestival()).toBeNull();
    expect(emitted[emitted.length - 1]).toBeNull();
  });
});
