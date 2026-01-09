import { Injectable } from "@angular/core";
import { signal } from "@angular/core";
import { inject } from "@angular/core";
import { ReservantApiService } from "../services/reservant-api";
import { ReservantDto } from "../types/reservant-dto";
import { finalize, tap } from "rxjs";
import { ReservantWorkflowApi } from "../services/reservant-workflow-api";
import { ReservantWorkflowState } from "../types/reservant-dto";
import { ReservantWorkflowFlagsDto } from "../types/reservant-workflow-flags-dto";
import { ReservantContactApi } from "../services/reservant-contact-api";
import { ReservantContactDto } from "../types/reservant-contact-dto";
import { ContactDto } from "../types/contact-dto";
import { ReservationService } from "../services/reservation.service";
@Injectable({
    providedIn: 'root',
})
export class ReservantStore {

    private readonly api = inject(ReservantApiService);
    private readonly workflowApi = inject(ReservantWorkflowApi);
    private readonly contactApi = inject(ReservantContactApi);
    private readonly reservationService = inject(ReservationService);
    private readonly _reservants = signal<ReservantDto[]>([]);
    private readonly _contacts = signal<ContactDto[]>([]);
    private readonly _contactTimeline = signal<ReservantContactDto[]>([]);
    private readonly _currentFestivalId = signal<number | null>(null);

    public readonly reservants = this._reservants.asReadonly();
    public readonly contacts = this._contacts.asReadonly();
    public readonly contactTimeline = this._contactTimeline.asReadonly();
    public readonly currentFestivalId = this._currentFestivalId.asReadonly();
    loading = signal(false);
    error = signal<string | null>(null);

    setFestival(festivalId: number | null): void {
        this._currentFestivalId.set(festivalId);
    }

    loadAll(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (reservants) => {
                this._reservants.set(reservants);
            },
            error: (error) => {
                console.error('Error loading reservants:', error);
            },
        });
    }

    loadByFestival(festivalId: number): void {
        this.loading.set(true);
        this.error.set(null);
        this.reservationService.getReservantsByFestival(festivalId).subscribe({
            next: (reservants) => {
                this._reservants.set(reservants);
            },
            error: (error) => {
                console.error('Error loading reservants for festival:', error);
                this.error.set(error.message || 'Erreur lors du chargement des réservants');
            },
        });
    }
    loadById(id: number): void {
        this.loading.set(true);
        this.api.getbyid(id).subscribe({
            next: (reservant) => {
                this._reservants.set([reservant]);
            },
            error: (error) => {
                console.error('Error loading reservant:', error);
            },
        });
    }
    create(reservant: ReservantDto): void {
        this.loading.set(true);
        this.error.set(null);
        this.api.create(reservant).subscribe({
            next: (newReservant) => {
                // Append to existing list instead of replacing
                this._reservants.set([...this._reservants(), newReservant]);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error creating reservant:', error);
                this.error.set(error.message || 'Erreur lors de la création');
                this.loading.set(false);
            },
        });
    }
    update(reservant: ReservantDto) {
        this.loading.set(true);
        return this.api.update(reservant).pipe(
            tap((updated) => this._reservants.set([updated])),
            finalize(() => this.loading.set(false)),
        );
    }
    delete(reservant: ReservantDto): void {
        this.loading.set(true);
        this.api.delete(reservant).subscribe({
            next: (reservant) => {
                this._reservants.set([reservant]);
            },
            error: (error) => {
                console.error('Error deleting reservant:', error);
            },
        });
    }

    private canTransition(from: ReservantWorkflowState | undefined, to: ReservantWorkflowState): boolean {
        if (!from) return true;
        const allowed: Record<ReservantWorkflowState, ReservantWorkflowState[]> = {
            Pas_de_contact: ['Contact_pris', 'Discussion_en_cours', 'Sera_absent', 'Considere_absent'],
            Contact_pris: ['Discussion_en_cours', 'Sera_absent', 'Considere_absent'],
            Discussion_en_cours: ['Reservation_confirmee', 'Sera_absent', 'Considere_absent'],
            Sera_absent: [],
            Considere_absent: [],
            Reservation_confirmee: ['Facture'],
            Facture: ['Facture_payee'],
            Facture_payee: []
        };
        return allowed[from]?.includes(to) ?? false;
    }

    changeWorkflowState(reservantId: number, newState: ReservantWorkflowState): void {
        const current = this._reservants().find(r => r.id === reservantId);
        if (!this.canTransition(current?.workflow_state, newState)) {
            console.warn('Transition de workflow refusée', current?.workflow_state, '->', newState);
            return;
        }
        this.loading.set(true);
        this.workflowApi.updateState(reservantId, newState, this._currentFestivalId()).pipe(
            finalize(() => this.loading.set(false)),
        ).subscribe({
            next: (updated) => {
                this._reservants.set([updated]);
            },
            error: (error) => {
                console.error('Error updating workflow state:', error);
            },
        });
    }

    updateWorkflowFlags(reservantId: number, flags: ReservantWorkflowFlagsDto): void {
        this.loading.set(true);
        this.workflowApi.updateFlags(reservantId, flags, this._currentFestivalId()).pipe(
            finalize(() => this.loading.set(false)),
        ).subscribe({
            next: (updated) => {
                this._reservants.set([updated]);
            },
            error: (error) => {
                console.error('Error updating workflow flags:', error);
            },
        });
    }

    loadContacts(reservantId: number): void {
        this.contactApi.listContacts(reservantId).subscribe({
            next: (contacts) => this._contacts.set(contacts),
            error: (error) => console.error('Error loading contacts:', error),
        });
    }

    loadContactTimeline(reservantId: number): void {
        this.contactApi.listTimeline(reservantId).subscribe({
            next: (timeline) => this._contactTimeline.set(timeline),
            error: (error) => console.error('Error loading contact timeline:', error),
        });
    }

    addContactEvent(reservantId: number, contactId: number, dateContact: string): void {
        this.loading.set(true);
        this.contactApi.addContactEvent(reservantId, contactId, dateContact).pipe(
            finalize(() => this.loading.set(false)),
        ).subscribe({
            next: (event) => this._contactTimeline.set([...this._contactTimeline(), event]),
            error: (error) => console.error('Error adding contact event:', error),
        });
    }

    createContact(reservantId: number, contact: ContactDto): void {
        this.loading.set(true);
        this.contactApi.addContact(reservantId, contact).pipe(
            finalize(() => this.loading.set(false)),
        ).subscribe({
            next: (c) => this._contacts.set([...this._contacts(), c]),
            error: (error) => console.error('Error creating contact:', error),
        });
    }

    deleteContact(reservantId: number, contactId: number): void {
        this.loading.set(true);
        this.contactApi.deleteContact(reservantId, contactId).pipe(
            finalize(() => this.loading.set(false)),
        ).subscribe({
            next: () => this._contacts.set(this._contacts().filter(c => c.id !== contactId)),
            error: (error) => console.error('Error deleting contact:', error),
        });
    }

    deleteContactEvent(reservantId: number, eventId: number): void {
        this.loading.set(true);
        this.contactApi.deleteContactEvent(reservantId, eventId).pipe(
            finalize(() => this.loading.set(false)),
        ).subscribe({
            next: () => this._contactTimeline.set(this._contactTimeline().filter(e => e.id !== eventId)),
            error: (error) => console.error('Error deleting contact event:', error),
        });
    }
}
