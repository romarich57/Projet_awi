import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ReservantCardComponent } from './reservant-card-component';
import { ReservantStore } from '../../stores/reservant.store';
import { signal } from '@angular/core';
import { ReservantDto } from '../../types/reservant-dto';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

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
  contactError = signal<string | null>(null);
  contactTimeline = signal([]);
  loadContacts = jasmine.createSpy('loadContacts');
  loadContactTimeline = jasmine.createSpy('loadContactTimeline');
  changeWorkflowState = jasmine.createSpy('changeWorkflowState');
  updateWorkflowFlags = jasmine.createSpy('updateWorkflowFlags');
  addContactEvent = jasmine.createSpy('addContactEvent');
  deleteContact = jasmine.createSpy('deleteContact');
  createContact = jasmine.createSpy('createContact');
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
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ReservantStore, useValue: store },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ReservantCardComponent);
    component = fixture.componentInstance;
    // Set the input to trigger the effect
    fixture.componentRef.setInput('id', '5');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadById with id from route', () => {
    expect(store.loadById).toHaveBeenCalledWith(5);
  });

  it('should display reservant information', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test');
  });

  it('should display type label correctly', () => {
    expect(component.typeLabel('editeur')).toBe('Éditeur');
    expect(component.typeLabel('boutique')).toBe('Boutique');
  });

  it('should handle null values', () => {
    expect(component.displayValue(null)).toBe('-');
    expect(component.displayValue('test')).toBe('test');
  });

  it('should normalize contact priority to 0 or 1', () => {
    component.contactForm = {
      name: 'Test',
      email: 'contact@test.com',
      phone_number: '0123456789',
      job_title: 'Chef',
      priority: 1
    };
    component.createContact();
    expect(store.createContact).toHaveBeenCalledWith(
      5,
      jasmine.objectContaining({ priority: 1 })
    );

    component.contactForm = {
      name: 'Test 2',
      email: 'contact2@test.com',
      phone_number: '0123456789',
      job_title: 'Chef',
      priority: 3
    };
    component.createContact();
    const lastCall = store.createContact.calls.mostRecent().args[1];
    expect(lastCall.priority).toBe(0);
  });
});
