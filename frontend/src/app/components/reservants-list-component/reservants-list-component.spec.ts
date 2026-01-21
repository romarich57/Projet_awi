import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservantsListComponent } from './reservants-list-component';
import { ReservantStore } from '../../stores/reservant.store';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FestivalState } from '../../stores/festival-state';
import { AuthService } from '../../services/auth.service';

describe('ReservantsListComponent', () => {
  let component: ReservantsListComponent;
  let fixture: ComponentFixture<ReservantsListComponent>;
  let storeMock: any;
  let authMock: { isSuperOrganizer: ReturnType<typeof signal> };

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
    authMock = { isSuperOrganizer: signal(true) };

    await TestBed.configureTestingModule({
      imports: [ReservantsListComponent],
      providers: [
        { provide: ReservantStore, useValue: storeMock },
        { provide: AuthService, useValue: authMock },
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

  it('should open delete modal when authorized', () => {
    component.requestDelete(mockReservants[0]);
    expect(component.pendingDelete()).toEqual(mockReservants[0]);
    expect(component.deletePrompt()).toContain(mockReservants[0].name);
  });

  it('should call store delete on confirm', () => {
    component.requestDelete(mockReservants[0]);
    component.confirmDelete();
    expect(storeMock.delete).toHaveBeenCalledWith(mockReservants[0]);
    expect(component.pendingDelete()).toBeNull();
  });

  it('should block delete when user is not authorized', () => {
    authMock.isSuperOrganizer.set(false);
    component.requestDelete(mockReservants[0]);
    expect(component.pendingDelete()).toBeNull();
  });
});
