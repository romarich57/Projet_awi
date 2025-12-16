import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservantCardComponent } from './reservant-card-component';
import { ReservantStore } from '../../stores/reservant.store';
import { ReservantWorkflowApi } from '../../services/reservant-workflow-api';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ReservantCardComponent - Additional Tests', () => {
    let component: ReservantCardComponent;
    let fixture: ComponentFixture<ReservantCardComponent>;
    let storeMock: any;
    let workflowApiMock: any;
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
        currentReservant = signal(mockReservant);
        contacts = signal([]);
        contactTimeline = signal([]);
        loading = signal(false);
        error = signal(null);
        loadById = jasmine.createSpy('loadById');
        changeWorkflowState = jasmine.createSpy('changeWorkflowState');
        updateWorkflowFlags = jasmine.createSpy('updateWorkflowFlags');
        loadContacts = jasmine.createSpy('loadContacts');
        loadContactTimeline = jasmine.createSpy('loadContactTimeline');
        addContactEvent = jasmine.createSpy('addContactEvent');
    }

    beforeEach(async () => {
        storeMock = new MockReservantStore();

        workflowApiMock = jasmine.createSpyObj('ReservantWorkflowApi', ['updateState']);
        workflowApiMock.updateState.and.returnValue(of({ success: true }));

        routeMock = { snapshot: { paramMap: { get: () => '1' } } };

        await TestBed.configureTestingModule({
            imports: [ReservantCardComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ReservantStore, useClass: MockReservantStore },
                { provide: ReservantWorkflowApi, useValue: workflowApiMock },
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

    it('should call store changeWorkflowState on state change', () => {
        component.onWorkflowStateChange('Contact_pris');
        expect(storeMock.changeWorkflowState).toHaveBeenCalledWith(1, 'Contact_pris');
    });

    it('should display type label correctly', () => {
        expect(component.typeLabel('editeur')).toBe('Éditeur');
        expect(component.typeLabel('boutique')).toBe('Boutique');
    });

    it('should handle null values', () => {
        expect(component.displayValue(null)).toBe('-');
        expect(component.displayValue('test')).toBe('test');
    });

    it('should have workflow states', () => {
        expect(component.workflowStates.length).toBeGreaterThan(0);
    });

    it('should trigger contact event add', () => {
        component.selectedContactId = 1;
        component.addContactEvent();
        expect(storeMock.addContactEvent).toHaveBeenCalled();
    });
});
