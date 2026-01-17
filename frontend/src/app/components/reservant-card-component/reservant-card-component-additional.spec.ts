import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservantCardComponent } from './reservant-card-component';
import { ReservantStore } from '../../stores/reservant.store';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ReservantCardComponent - Additional Tests', () => {
    let component: ReservantCardComponent;
    let fixture: ComponentFixture<ReservantCardComponent>;
    let storeMock: any;
    let routeMock: any;

    const mockReservant = {
        id: 1,
        name: 'Test Reservant',
        email: 'test@test.com',
        type: 'editeur' as const,
        workflow_state: 'Pas_de_contact' as const,
        phone_number: '123456789',
        address: '123 Test St',
        siret: '12345678901234',
        notes: 'Test notes'
    };

    class MockReservantStore {
        reservants = signal([mockReservant]);
        contacts = signal([]);
        loadById = jasmine.createSpy('loadById');
        loadContacts = jasmine.createSpy('loadContacts');
        createContact = jasmine.createSpy('createContact');
    }

    beforeEach(async () => {
        storeMock = new MockReservantStore();

        routeMock = { snapshot: { paramMap: { get: () => '1' } } };

        await TestBed.configureTestingModule({
            imports: [ReservantCardComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ReservantStore, useClass: MockReservantStore },
                { provide: ActivatedRoute, useValue: routeMock }
            ]
        }).compileComponents();

        storeMock = TestBed.inject(ReservantStore);

        fixture = TestBed.createComponent(ReservantCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should display reservant information', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.textContent).toContain('Test Reservant');
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
        expect(storeMock.createContact).toHaveBeenCalledWith(
            1,
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
        const lastCall = storeMock.createContact.calls.mostRecent().args[1];
        expect(lastCall.priority).toBe(0);
    });
});
