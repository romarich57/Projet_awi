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
      workflow_state: 'Pas_de_contact'
    },
  ]);

  loadById = jasmine.createSpy('loadById');
  contacts = signal([]);
  contactTimeline = signal([]);
  loadContacts = jasmine.createSpy('loadContacts');
  loadContactTimeline = jasmine.createSpy('loadContactTimeline');
  changeWorkflowState = jasmine.createSpy('changeWorkflowState');
  updateWorkflowFlags = jasmine.createSpy('updateWorkflowFlags');
  addContactEvent = jasmine.createSpy('addContactEvent');
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
