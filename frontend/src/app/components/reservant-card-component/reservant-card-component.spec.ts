import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ReservantCardComponent } from './reservant-card-component';
import { ReservantStore } from '../../stores/reservant.store';
import { signal } from '@angular/core';
import { ReservantDto } from '../../types/reservant-dto';

class ReservantStoreMock {
  reservants = signal<ReservantDto[]>([
    {
      id: 5,
      name: 'Test',
      email: 'test@test.dev',
      type: 'editeur',
      phone_number: '0102030405',
      address: 'Rue Test',
      siret: '123',
      notes: 'note',
    },
  ]);

  loadById = jasmine.createSpy('loadById');
}

describe('ReservantCardComponent', () => {
  let component: ReservantCardComponent;
  let fixture: ComponentFixture<ReservantCardComponent>;
  let store: ReservantStoreMock;

  beforeEach(async () => {
    store = new ReservantStoreMock();
    await TestBed.configureTestingModule({
      imports: [ReservantCardComponent],
      providers: [
        provideRouter([]),
        { provide: ReservantStore, useValue: store },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservantCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadById with id from route', () => {
    expect(store.loadById).toHaveBeenCalledWith(5);
  });
});
