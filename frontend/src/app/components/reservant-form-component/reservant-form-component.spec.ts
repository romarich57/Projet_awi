import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservantFormComponent } from './reservant-form-component';
import { ReservantStore } from '../../stores/reservant.store';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Location, CommonModule } from '@angular/common';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('ReservantFormComponent', () => {
  let component: ReservantFormComponent;
  let fixture: ComponentFixture<ReservantFormComponent>;
  let storeMock: any;
  let routeMock: any;

  const mockReservant = {
    id: 1,
    name: 'Test Reservant',
    email: 'test@test.com',
    type: 'editeur',
    workflow_state: 'Pas_de_contact',
    phone_number: '0123456789',
    address: '123 Test St',
    siret: '12345678901234',
    notes: 'Test notes'
  };

  console.log('ReservantStore token:', ReservantStore);

  class MockReservantStore {
    reservants = signal([mockReservant]);
    currentReservant = signal(null);
    loading = signal(false);
    error = signal(null);
    loadById = jasmine.createSpy('loadById');
    create = jasmine.createSpy('create').and.returnValue(of({}));
    update = jasmine.createSpy('update').and.returnValue(of({}));
  }

  beforeEach(async () => {
    storeMock = new MockReservantStore(); // Keep reference for assertions

    const locationMock = jasmine.createSpyObj('Location', ['back']);

    routeMock = {
      snapshot: {
        paramMap: {
          get: (key: string) => key === 'id' ? '1' : null
        }
      }
    };

    try {
      await TestBed.configureTestingModule({
        imports: [ReservantFormComponent, ReactiveFormsModule, CommonModule, RouterTestingModule],
        providers: [
          { provide: ReservantStore, useClass: MockReservantStore }, // Use useClass
          { provide: ActivatedRoute, useValue: routeMock },
          { provide: Location, useValue: locationMock }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      })
        .compileComponents();

      // Update storeMock reference to the injected instance
      storeMock = TestBed.inject(ReservantStore);
      console.log('Injected Store in beforeEach:', storeMock);

      fixture = TestBed.createComponent(ReservantFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    } catch (e) {
      console.error('ReservantFormComponent Test Setup Error:', e);
      throw e;
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ReservantStore', () => {
    const injectedStore = TestBed.inject(ReservantStore);
    console.log('Equality Check:', injectedStore === storeMock);
    expect(injectedStore).toBe(storeMock);
  });

  it('should initialize form with empty values in create mode', () => {
    // Re-create component with no ID
    TestBed.resetTestingModule();
    routeMock.snapshot.paramMap.get = () => null;

    TestBed.configureTestingModule({
      imports: [ReservantFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: ReservantStore, useValue: storeMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    });

    fixture = TestBed.createComponent(ReservantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.form.get('name')?.value).toBe('');
  });

  it('should load reservant in edit mode', () => {
    expect(storeMock.loadById).toHaveBeenCalledWith(1);
  });

  it('should validate required fields', () => {
    const nameControl = component.form.get('name');
    nameControl?.setValue('');
    expect(nameControl?.valid).toBeFalsy();
    nameControl?.setValue('Valid Name');
    expect(nameControl?.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    emailControl?.setValue('valid@test.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should submit form when valid (create)', () => {
    // Setup create mode
    Object.defineProperty(component, 'reservantId', { value: null });

    component.form.patchValue({
      name: 'New Reservant',
      email: 'new@test.com',
      type: 'editeur',
      phone_number: '0123456789',
      address: 'Address',
      siret: '123',
      notes: 'Notes'
    });

    component.onSubmit();
    expect(storeMock.create).toHaveBeenCalled();
  });

  it('should submit form when valid (update)', () => {
    // Setup edit mode (default in beforeEach)
    storeMock.currentReservant.set(mockReservant);
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Updated Name',
      email: 'test@test.com',
      type: 'editeur'
    });

    component.onSubmit();
    expect(storeMock.update).toHaveBeenCalled();
  });

  it('should not submit if form is invalid', () => {
    component.form.patchValue({ name: '' }); // Invalid
    component.onSubmit();
    expect(storeMock.create).not.toHaveBeenCalled();
    expect(storeMock.update).not.toHaveBeenCalled();
  });
});

describe('ReservantStore Injection Isolated', () => {
  let storeMock: any;

  beforeEach(() => {
    storeMock = {
      reservants: signal([]),
      currentReservant: signal(null),
      loading: signal(false),
      error: signal(null),
      loadById: jasmine.createSpy('loadById'),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ReservantStore, useValue: storeMock }
      ]
    });
  });

  it('should inject ReservantStore mock', () => {
    const injectedStore = TestBed.inject(ReservantStore);
    expect(injectedStore).toBe(storeMock);
  });
});
