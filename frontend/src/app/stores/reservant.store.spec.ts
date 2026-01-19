import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ReservantStore } from './reservant.store';
import { ReservantApiService } from '../services/reservant-api';
import { ReservantWorkflowApi } from '../services/reservant-workflow-api';
import { ReservantDto } from '../types/reservant-dto';
import { ReservantContactApi } from '../services/reservant-contact-api';
import { ReservationService } from '../services/reservation.service';

describe('ReservantStore', () => {
    let store: ReservantStore;
    let apiMock: jasmine.SpyObj<ReservantApiService>;
    let workflowApiMock: jasmine.SpyObj<ReservantWorkflowApi>;
    let contactApiMock: jasmine.SpyObj<ReservantContactApi>;
    let reservationServiceMock: jasmine.SpyObj<ReservationService>;

    const mockReservant: ReservantDto = {
        id: 1,
        name: 'Test Reservant',
        email: 'test@example.com',
        type: 'editeur',
        phone_number: '0123456789',
        address: '123 Test St',
        siret: '12345678901234',
        notes: 'Test notes',
        workflow_state: 'Pas_de_contact'
    };

    const mockReservantList: ReservantDto[] = [
        mockReservant,
        {
            id: 2,
            name: 'Another Reservant',
            email: 'another@example.com',
            type: 'boutique',
            workflow_state: 'Contact_pris'
        }
    ];

    beforeEach(() => {
        
        apiMock = jasmine.createSpyObj('ReservantApiService', [
            'list',
            'getbyid',
            'create',
            'update',
            'delete'
        ]);
        apiMock.list.and.returnValue(of(mockReservantList));

        workflowApiMock = jasmine.createSpyObj('ReservantWorkflowApi', ['updateState', 'updateFlags']);

        contactApiMock = jasmine.createSpyObj('ReservantContactApi', ['listContacts', 'listTimeline', 'addContact', 'addContactEvent']);
        contactApiMock.listContacts.and.returnValue(of([]));
        contactApiMock.listTimeline.and.returnValue(of([]));
        reservationServiceMock = jasmine.createSpyObj('ReservationService', ['getReservantsByFestival']);
        reservationServiceMock.getReservantsByFestival.and.returnValue(of(mockReservantList));

        try {
            TestBed.configureTestingModule({
                providers: [
                    ReservantStore,
                    { provide: ReservantApiService, useValue: apiMock },
                    { provide: ReservantWorkflowApi, useValue: workflowApiMock },
                    { provide: ReservantContactApi, useValue: contactApiMock },
                    { provide: ReservationService, useValue: reservationServiceMock }
                ]
            });

            store = TestBed.inject(ReservantStore);
        } catch (e) {
            console.error('ReservantStore Test Setup Error:', e);
            throw e;
        }
    });

    describe('Initialization', () => {
        it('should be created', () => {
            expect(store).toBeTruthy();
        });

        it('should start with empty reservants array', () => {
            expect(store.reservants()).toEqual([]);
        });

        it('should start with loading=false', () => {
            expect(store.loading()).toBe(false);
        });

        it('should start with error=null', () => {
            expect(store.error()).toBeNull();
        });
    });

    describe('loadAll()', () => {
        it('should set loading=true when loadAll() is called', () => {
            apiMock.list.and.returnValue(of([]).pipe(delay(1)));

            store.loadAll();

            expect(store.loading()).toBe(true);
        });

        it('should populate reservants when loadAll() succeeds', (done) => {
            apiMock.list.and.returnValue(of(mockReservantList));

            store.loadAll();

            setTimeout(() => {
                expect(store.reservants()).toEqual(mockReservantList);
                expect(store.reservants().length).toBe(2);
                done();
            }, 50);
        });

        it('should call api.list() exactly once', () => {
            apiMock.list.and.returnValue(of([]));

            store.loadAll();

            expect(apiMock.list).toHaveBeenCalledTimes(1);
        });

        it('should handle error on loadAll()', (done) => {
            const consoleErrorSpy = spyOn(console, 'error');
            const error = new Error('API Error');
            apiMock.list.and.returnValue(throwError(() => error));

            store.loadAll();

            setTimeout(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading reservants:', error);
                done();
            }, 50);
        });

        it('should log error to console on loadAll() failure', (done) => {
            const consoleErrorSpy = spyOn(console, 'error');
            apiMock.list.and.returnValue(throwError(() => new Error('Network error')));

            store.loadAll();

            setTimeout(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
                done();
            }, 50);
        });

        it('should replace any existing reservants with new data', (done) => {
            const initialData = [{ ...mockReservant, id: 99 }];
            apiMock.list.and.returnValue(of(initialData));
            store.loadAll();

            setTimeout(() => {
                expect(store.reservants()).toEqual(initialData);

               
                const newData = mockReservantList;
                apiMock.list.and.returnValue(of(newData));
                store.loadAll();

                setTimeout(() => {
                    expect(store.reservants()).toEqual(newData);
                    expect(store.reservants().length).toBe(2);
                    done();
                }, 50);
            }, 50);
        });
    });

    describe('loadById()', () => {
        it('should load single reservant by id', (done) => {
            apiMock.getbyid.and.returnValue(of(mockReservant));

            store.loadById(1);

            setTimeout(() => {
                expect(store.reservants()).toEqual([mockReservant]);
                expect(store.reservants().length).toBe(1);
                done();
            }, 50);
        });

        it('should call api.getbyid() with correct id', () => {
            apiMock.getbyid.and.returnValue(of(mockReservant));

            store.loadById(5);

            expect(apiMock.getbyid).toHaveBeenCalledWith(5);
        });

        it('should set loading=true during loadById()', () => {
            apiMock.getbyid.and.returnValue(of(mockReservant).pipe(delay(1)));

            store.loadById(1);

            expect(store.loading()).toBe(true);
        });

        it('should replace reservants array with single item', (done) => {
            apiMock.list.and.returnValue(of(mockReservantList));
            store.loadAll();

            setTimeout(() => {
                expect(store.reservants().length).toBe(2);

                apiMock.getbyid.and.returnValue(of(mockReservant));
                store.loadById(1);

                setTimeout(() => {
                    expect(store.reservants()).toEqual([mockReservant]);
                    expect(store.reservants().length).toBe(1);
                    done();
                }, 50);
            }, 50);
        });

        it('should handle error on loadById()', (done) => {
            const consoleErrorSpy = spyOn(console, 'error');
            const error = new Error('Not found');
            apiMock.getbyid.and.returnValue(throwError(() => error));

            store.loadById(999);

            setTimeout(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading reservant:', error);
                done();
            }, 50);
        });
    });

    describe('create()', () => {
        const newReservant: ReservantDto = {
            id: 3,
            name: 'New Reservant',
            email: 'new@example.com',
            type: 'prestataire',
            workflow_state: 'Pas_de_contact'
        };

        it('should reload reservants after create()', (done) => {
            const refreshedList = [...mockReservantList, newReservant];
            apiMock.create.and.returnValue(of(newReservant));
            apiMock.list.and.returnValue(of(refreshedList));

            store.create(newReservant);

            setTimeout(() => {
                expect(store.reservants()).toEqual(refreshedList);
                expect(store.reservants().length).toBe(3);
                done();
            }, 50);
        });

        it('should call api.list() after create()', (done) => {
            apiMock.create.and.returnValue(of(newReservant));
            apiMock.list.and.returnValue(of([newReservant]));

            store.create(newReservant);

            setTimeout(() => {
                expect(apiMock.list).toHaveBeenCalled();
                done();
            }, 50);
        });

        it('should set loading=true during create()', () => {
            apiMock.create.and.returnValue(of(newReservant).pipe(delay(1)));

            store.create(newReservant);

            expect(store.loading()).toBe(true);
        });

        it('should set loading=false after create() completes', (done) => {
            apiMock.create.and.returnValue(of(newReservant));

            store.create(newReservant);

            setTimeout(() => {
                expect(store.loading()).toBe(false);
                done();
            }, 50);
        });

        it('should set error=null before create()', () => {
            (store as any)._error.set('Previous error');
            apiMock.create.and.returnValue(of(newReservant));

            store.create(newReservant);

            expect(store.error()).toBeNull();
        });

        it('should set error message on create() failure', (done) => {
            const error = { message: 'Creation failed' };
            apiMock.create.and.returnValue(throwError(() => error));

            store.create(newReservant);

            setTimeout(() => {
                expect(store.error()).toBe('Creation failed');
                done();
            }, 50);
        });

        it('should call api.create() with correct payload', () => {
            apiMock.create.and.returnValue(of(newReservant));

            store.create(newReservant);

            expect(apiMock.create).toHaveBeenCalledWith(newReservant);
        });

        it('should handle network errors gracefully', (done) => {
            const consoleErrorSpy = spyOn(console, 'error');
            const networkError = new Error('Network error');
            apiMock.create.and.returnValue(throwError(() => networkError));

            store.create(newReservant);

            setTimeout(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating reservant:', networkError);
                expect(store.error()).toBe('Network error');
                expect(store.loading()).toBe(false);
                done();
            }, 50);
        });
    });

    describe('update()', () => {
        const updatedReservant: ReservantDto = {
            ...mockReservant,
            name: 'Updated Name',
            email: 'updated@example.com'
        };

        it('should update reservant in store', (done) => {
            apiMock.update.and.returnValue(of(updatedReservant));

            store.update(updatedReservant).subscribe(() => {
                expect(store.reservants()).toContain(updatedReservant);
                done();
            });
        });

        it('should set loading=true during update()', () => {
            apiMock.update.and.returnValue(of(updatedReservant).pipe(delay(1)));

            store.update(updatedReservant).subscribe();

            expect(store.loading()).toBe(true);
        });

        it('should set loading=false after update() completes', (done) => {
            apiMock.update.and.returnValue(of(updatedReservant));

            store.update(updatedReservant).subscribe(() => {
                setTimeout(() => {
                    expect(store.loading()).toBe(false);
                    done();
                }, 50);
            });
        });

        it('should call api.update() with correct payload', () => {
            apiMock.update.and.returnValue(of(updatedReservant));

            store.update(updatedReservant).subscribe();

            expect(apiMock.update).toHaveBeenCalledWith(updatedReservant);
        });

        it('should return Observable from update()', () => {
            apiMock.update.and.returnValue(of(updatedReservant));

            const result = store.update(updatedReservant);

            expect(result).toBeDefined();
            expect(typeof result.subscribe).toBe('function');
        });

        it('should handle update errors', (done) => {
            const error = new Error('Update failed');
            apiMock.update.and.returnValue(throwError(() => error));

            store.update(updatedReservant).subscribe({
                next: () => fail('Should have errored'),
                error: (err) => {
                    expect(err).toBe(error);
                    done();
                }
            });
        });
    });

    describe('workflow updates', () => {
        it('should call workflowApi.updateState with id and state', () => {
            workflowApiMock.updateState.and.returnValue(of(mockReservant));

            store.changeWorkflowState(1, 'Contact_pris');

            expect(workflowApiMock.updateState).toHaveBeenCalledWith(1, 'Contact_pris', null);
        });

        it('should set loading=true on state change', () => {
            workflowApiMock.updateState.and.returnValue(of(mockReservant).pipe(delay(1)));

            store.changeWorkflowState(1, 'Contact_pris');

            expect(store.loading()).toBe(true);
        });

        it('should call workflowApi.updateFlags with provided flags', () => {
            const flags = { liste_jeux_demandee: true };
            workflowApiMock.updateFlags.and.returnValue(of(mockReservant));

            store.updateWorkflowFlags(2, flags);

            expect(workflowApiMock.updateFlags).toHaveBeenCalledWith(2, flags, null);
        });

        it('should set loading=true on flag update', () => {
            workflowApiMock.updateFlags.and.returnValue(of(mockReservant).pipe(delay(1)));

            store.updateWorkflowFlags(2, { jeux_recus: true });

            expect(store.loading()).toBe(true);
        });
    });

    describe('contacts', () => {
        it('should load contacts list', () => {
            const contacts = [{ id: 1, name: 'Contact', email: 'c@test.com', phone_number: '1', job_title: 'Resp', priority: 1 }];
            contactApiMock.listContacts.and.returnValue(of(contacts as any));

            store.loadContacts(1);

            expect(contactApiMock.listContacts).toHaveBeenCalledWith(1);
        });

        it('should load contact timeline', () => {
            const timeline = [{ id: 1, contactId: 1, reservantId: 1, festivalId: 1, contactName: 'A', contactEmail: 'a@test.com', contactPhoneNumber: '', contactJobTitle: '', contactPriority: 1, dateContact: new Date().toISOString() }];
            contactApiMock.listTimeline.and.returnValue(of(timeline as any));

            store.loadContactTimeline(1);

            expect(contactApiMock.listTimeline).toHaveBeenCalledWith(1);
        });

        it('should add contact event', () => {
            contactApiMock.addContactEvent.and.returnValue(of({
                id: 1,
                contactId: 1,
                reservantId: 1,
                festivalId: 1,
                contactName: 'Test',
                contactEmail: 'c@test.com',
                contactPhoneNumber: '1',
                contactJobTitle: 'Resp',
                contactPriority: 1,
                dateContact: new Date().toISOString()
            } as any));

            store.addContactEvent(1, 1, new Date().toISOString());

            expect(contactApiMock.addContactEvent).toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should remove reservant from list after delete', (done) => {
            apiMock.delete.and.returnValue(of(mockReservant));
            apiMock.list.and.returnValue(of([]));

            store.delete(mockReservant);

            setTimeout(() => {
                expect(store.reservants()).toEqual([]);
                done();
            }, 50);
        });

        it('should set loading=true during delete()', () => {
            apiMock.delete.and.returnValue(of(mockReservant).pipe(delay(1)));
            apiMock.list.and.returnValue(of([]));

            store.delete(mockReservant);

            expect(store.loading()).toBe(true);
        });

        it('should call api.delete() with correct reservant', () => {
            apiMock.delete.and.returnValue(of(mockReservant));

            store.delete(mockReservant);

            expect(apiMock.delete).toHaveBeenCalledWith(mockReservant);
        });

        it('should handle delete errors', (done) => {
            const consoleErrorSpy = spyOn(console, 'error');
            const error = new Error('Delete failed');
            apiMock.delete.and.returnValue(throwError(() => error));

            store.delete(mockReservant);

            setTimeout(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting reservant:', error);
                done();
            }, 50);
        });
    });
});
