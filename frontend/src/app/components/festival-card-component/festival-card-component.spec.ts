import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FestivalCardComponent } from './festival-card-component';
import { FestivalDto } from '../../types/festival-dto';

describe('FestivalCardComponent', () => {
  let component: FestivalCardComponent;
  let fixture: ComponentFixture<FestivalCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalCardComponent);
    component = fixture.componentInstance;
    const mockFestival: FestivalDto = {
      id: 1,
      name: 'Test Fest',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-02'),
      stock_tables_standard: 10,
      stock_tables_grande: 5,
      stock_tables_mairie: 2,
      stock_chaises: 50,
    }
    fixture.componentRef.setInput('festival', mockFestival)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
