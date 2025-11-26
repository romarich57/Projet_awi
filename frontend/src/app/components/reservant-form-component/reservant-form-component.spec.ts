import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReservantFormComponent } from './reservant-form-component';
import { ReservantStore } from '../../stores/reservant.store';
import { signal } from '@angular/core';
import { ReservantDto } from '../../types/reservant-dto';

class ReservantStoreMock {
  reservants = signal<ReservantDto[]>([
    {
      id: 7,
      name: 'Jane',
      email: 'jane@test.dev',
      type: 'boutique',
      phone_number: '0700000000',
      address: 'Rue Demo',
      siret: '456',
      notes: 'note',
    },
  ]);

  loadById = jasmine.createSpy('loadById');
  update = jasmine.createSpy('update').and.returnValue(of(this.reservants()[0]));
}

describe('ReservantFormComponent', () => {
  let component: ReservantFormComponent;
  let fixture: ComponentFixture<ReservantFormComponent>;
  let store: ReservantStoreMock;

  beforeEach(async () => {
    store = new ReservantStoreMock();
    await TestBed.configureTestingModule({
      imports: [ReservantFormComponent],
      providers: [
        provideRouter([]),
        { provide: ReservantStore, useValue: store },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reservant by id on init', () => {
    expect(store.loadById).toHaveBeenCalledWith(7);
  });

  it('should prefill form', () => {
    expect(component.form.value.name).toBe('Jane');
    expect(component.form.value.type).toBe('boutique');
  });

  it('should call update on submit when form valid', () => {
    component.onSubmit();
    expect(store.update).toHaveBeenCalled();
  });
});
