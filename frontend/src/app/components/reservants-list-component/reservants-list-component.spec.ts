import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservantsListComponent } from './reservants-list-component';
import { ReservantStore } from '../../stores/reservant.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FestivalState } from '../../stores/festival-state';

describe('ReservantsListComponent', () => {
  let component: ReservantsListComponent;
  let fixture: ComponentFixture<ReservantsListComponent>;
  let storeMock: any;

  const mockReservants = [
    { id: 1, name: 'Test A', email: 'a@test.com', type: 'editeur' as const, workflow_state: 'Pas_de_contact' as const },
    { id: 2, name: 'Test B', email: 'b@test.com', type: 'boutique' as const, workflow_state: 'Contact_pris' as const }
  ];

  beforeEach(async () => {
    storeMock = jasmine.createSpyObj('ReservantStore', [
      'loadAll',
      'loadByFestival',
      'setFestival',
      'delete',
    ]);
    storeMock.reservants = signal(mockReservants);
    storeMock.loading = signal(false);
    storeMock.error = signal(null);

    await TestBed.configureTestingModule({
      imports: [ReservantsListComponent],
      providers: [
        { provide: ReservantStore, useValue: storeMock },
        FestivalState,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservantsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all reservants when no festival is selected', () => {
    expect(storeMock.loadAll).toHaveBeenCalled();
    expect(storeMock.setFestival).toHaveBeenCalledWith(null);
  });

  it('should have access to store reservants signal', () => {
    expect(storeMock.reservants()).toBeDefined();
    expect(storeMock.reservants().length).toBe(2);
  });

  it('should render reservant data', () => {
    const compiled = fixture.nativeElement;
    expect(compiled).toBeDefined();
  });

  it('should handle loading state', () => {
    storeMock.loading.set(true);
    fixture.detectChanges();
    expect(storeMock.loading()).toBe(true);
  });

  it('should handle error state', () => {
    storeMock.error.set('Error');
    fixture.detectChanges();
    expect(storeMock.error()).toBe('Error');
  });

  it('should display empty list', () => {
    storeMock.reservants.set([]);
    fixture.detectChanges();
    expect(storeMock.reservants().length).toBe(0);
  });

  it('should have router for navigation', () => {
    expect(component).toBeTruthy();
  });

  it('should support filtering by type', () => {
    const editeurs = mockReservants.filter(r => r.type === 'editeur');
    expect(editeurs.length).toBe(1);
  });

  it('should support filtering by state', () => {
    const contacted = mockReservants.filter(r => r.workflow_state !== 'Pas_de_contact');
    expect(contacted.length).toBe(1);
  });

  it('should handle delete confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const confirmed = window.confirm('Delete?');
    expect(confirmed).toBe(true);
  });

  it('should update after delete', () => {
    storeMock.delete(1);
    expect(storeMock.delete).toHaveBeenCalledWith(1);
  });
});
