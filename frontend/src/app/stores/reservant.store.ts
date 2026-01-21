import { Injectable, inject, signal } from "@angular/core";
import { ReservantApiService } from "../services/reservant-api";
import { ReservantDto, ReservantWorkflowState } from "../types/reservant-dto";
import { ReservantDeleteSummaryDto } from "../types/reservant-delete-summary-dto";
import { catchError, finalize, map, switchMap, tap, throwError, type Observable } from "rxjs";
import { ReservantWorkflowApi } from "../services/reservant-workflow-api";
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
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _contactError = signal<string | null>(null);
    private readonly _deleteSummary = signal<ReservantDeleteSummaryDto | null>(null);
    private readonly _deleteSummaryLoading = signal(false);
    private readonly _deleteSummaryError = signal<string | null>(null);

    public readonly reservants = this._reservants.asReadonly();
    public readonly contacts = this._contacts.asReadonly();
    public readonly contactTimeline = this._contactTimeline.asReadonly();
    public readonly currentFestivalId = this._currentFestivalId.asReadonly();
    public readonly loading = this._loading.asReadonly();
    public readonly error = this._error.asReadonly();
    public readonly contactError = this._contactError.asReadonly();
    public readonly deleteSummary = this._deleteSummary.asReadonly();
    public readonly deleteSummaryLoading = this._deleteSummaryLoading.asReadonly();
    public readonly deleteSummaryError = this._deleteSummaryError.asReadonly();

    // Role : Definir le festival courant pour filtrer les reservants.
    // Preconditions : Aucune.
    // Postconditions : Le signal _currentFestivalId est mis a jour.
    setFestival(festivalId: number | null): void {
        this._currentFestivalId.set(festivalId);
    }

    // Role : Charger tous les reservants.
    // Preconditions : ReservantApiService est disponible.
    // Postconditions : Le signal _reservants est mis a jour.
    loadAll(): void {
        this._loading.set(true);
        this._error.set(null);
        this.api.list().pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (reservants) => {
                this._reservants.set(reservants);
            },
            error: (error) => {
                console.error('Error loading reservants:', error);
                this._error.set(error.message || 'Erreur lors du chargement des réservants');
            },
        });
    }

    // Role : Charger les reservants pour un festival donne.
    // Preconditions : festivalId est valide.
    // Postconditions : Le signal _reservants est mis a jour et l'erreur est ajustee.
    loadByFestival(festivalId: number): void {
        this._loading.set(true);
        this._error.set(null);
        this.reservationService.getReservantsByFestival(festivalId).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (reservants) => {
                this._reservants.set(reservants);
            },
            error: (error) => {
                console.error('Error loading reservants for festival:', error);
                this._error.set(error.message || 'Erreur lors du chargement des réservants');
            },
        });
    }
    // Role : Charger un reservant par identifiant.
    // Preconditions : id est valide.
    // Postconditions : Le signal _reservants contient le reservant charge.
    loadById(id: number): void {
        this._loading.set(true);
        this._error.set(null);
        this.api.getbyid(id).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (reservant) => {
                this._reservants.set([reservant]);
            },
            error: (error) => {
                console.error('Error loading reservant:', error);
                this._error.set(error.message || 'Erreur lors du chargement du réservant');
            },
        });
    }
    // Role : Creer un reservant et l'ajouter a la liste locale.
    // Preconditions : Un objet ReservantDto valide est fourni.
    // Postconditions : Le reservant est ajoute et les etats loading/error sont mis a jour.
    create(reservant: ReservantDto): Observable<void> {
        this._loading.set(true);
        this._error.set(null);
        return this.api.create(reservant).pipe(
            switchMap(() => this.fetchReservantsAfterMutation()),
            tap((reservants) => this._reservants.set(reservants)),
            map(() => undefined),
            catchError((error) => {
                if (error?.status !== 409) {
                    console.error('Error creating reservant:', error);
                }
                this._error.set(this.extractErrorMessage(error) || 'Erreur lors de la création');
                return throwError(() => error);
            }),
            finalize(() => this._loading.set(false)),
        );
    }
    // Role : Mettre a jour un reservant.
    // Preconditions : Un objet ReservantDto valide est fourni.
    // Postconditions : Le signal _reservants est mis a jour avec la version modifiee.
    update(reservant: ReservantDto): Observable<ReservantDto> {
        this._loading.set(true);
        this._error.set(null);
        return this.api.update(reservant).pipe(
            tap((updated) => this._reservants.set([updated])),
            catchError((error) => {
                if (error?.status !== 409) {
                    console.error('Error updating reservant:', error);
                }
                this._error.set(this.extractErrorMessage(error) || 'Erreur lors de la mise a jour');
                return throwError(() => error);
            }),
            finalize(() => this._loading.set(false)),
        );
    }
    // Role : Supprimer un reservant.
    // Preconditions : Un objet ReservantDto valide est fourni.
    // Postconditions : Le signal _reservants est mis a jour si la suppression reussit.
    delete(reservant: ReservantDto): void {
        this._loading.set(true);
        this._error.set(null);
        this.api.delete(reservant).pipe(
            switchMap(() => this.fetchReservantsAfterMutation()),
            tap((reservants) => this._reservants.set(reservants)),
            finalize(() => this._loading.set(false)),
        ).subscribe({
            error: (error) => {
                console.error('Error deleting reservant:', error);
                this._error.set(this.extractErrorMessage(error) || 'Erreur lors de la suppression');
            },
        });
    }

    // Role : Charger le resume des dependances supprimees.
    // Preconditions : reservantId est valide.
    // Postconditions : Les signaux deleteSummary* sont mis a jour.
    loadDeleteSummary(reservantId: number): void {
        this._deleteSummaryLoading.set(true);
        this._deleteSummaryError.set(null);
        this._deleteSummary.set(null);
        this.api.getDeleteSummary(reservantId).pipe(
            finalize(() => this._deleteSummaryLoading.set(false)),
        ).subscribe({
            next: (summary) => this._deleteSummary.set(summary),
            error: (error) => {
                console.error('Error loading delete summary:', error);
                this._deleteSummaryError.set(
                    this.extractErrorMessage(error) || 'Erreur lors du chargement du résumé',
                );
            },
        });
    }

    // Role : Reinitialiser le resume de suppression.
    // Preconditions : Aucune.
    // Postconditions : Les signaux deleteSummary* sont reinitialises.
    clearDeleteSummary(): void {
        this._deleteSummary.set(null);
        this._deleteSummaryError.set(null);
        this._deleteSummaryLoading.set(false);
    }

    // Role : Verifier si une transition de workflow est autorisee.
    // Preconditions : Les etats source et destination sont fournis.
    // Postconditions : Retourne true si la transition est valide, sinon false.
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

    // Role : Changer l'etat de workflow d'un reservant avec validation.
    // Preconditions : reservantId est valide et currentFestivalId est defini si requis.
    // Postconditions : Le reservant est mis a jour si la transition est autorisee.
    changeWorkflowState(reservantId: number, newState: ReservantWorkflowState): void {
        const current = this._reservants().find(r => r.id === reservantId);
        if (!this.canTransition(current?.workflow_state, newState)) {
            console.warn('Transition de workflow refusée', current?.workflow_state, '->', newState);
            return;
        }
        this._loading.set(true);
        this.workflowApi.updateState(reservantId, newState, this._currentFestivalId()).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (updated) => {
                this._reservants.set([updated]);
            },
            error: (error) => {
                console.error('Error updating workflow state:', error);
            },
        });
    }

    // Role : Mettre a jour les indicateurs de workflow d'un reservant.
    // Preconditions : reservantId est valide et flags est fourni.
    // Postconditions : Le reservant est mis a jour dans le store.
    updateWorkflowFlags(reservantId: number, flags: ReservantWorkflowFlagsDto): void {
        this._loading.set(true);
        this.workflowApi.updateFlags(reservantId, flags, this._currentFestivalId()).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (updated) => {
                this._reservants.set([updated]);
            },
            error: (error) => {
                console.error('Error updating workflow flags:', error);
            },
        });
    }

    // Role : Charger les contacts d'un reservant.
    // Preconditions : reservantId est valide.
    // Postconditions : Le signal _contacts est mis a jour.
    loadContacts(reservantId: number): void {
        this._contactError.set(null);
        this.contactApi.listContacts(reservantId).subscribe({
            next: (contacts) => this._contacts.set(contacts),
            error: (error) => {
                console.error('Error loading contacts:', error);
                this._contactError.set(this.extractErrorMessage(error) || 'Erreur lors du chargement des contacts');
            },
        });
    }

    // Role : Charger la timeline des contacts d'un reservant.
    // Preconditions : reservantId est valide.
    // Postconditions : Le signal _contactTimeline est mis a jour.
    loadContactTimeline(reservantId: number): void {
        this.contactApi.listTimeline(reservantId).subscribe({
            next: (timeline) => this._contactTimeline.set(timeline),
            error: (error) => console.error('Error loading contact timeline:', error),
        });
    }

    // Role : Ajouter un evenement de contact pour un reservant.
    // Preconditions : reservantId, contactId et dateContact sont valides.
    // Postconditions : Le signal _contactTimeline est mis a jour.
    addContactEvent(reservantId: number, contactId: number, dateContact: string): void {
        this._loading.set(true);
        this.contactApi.addContactEvent(reservantId, contactId, dateContact).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (event) => this._contactTimeline.set([...this._contactTimeline(), event]),
            error: (error) => console.error('Error adding contact event:', error),
        });
    }

    // Role : Creer un contact pour un reservant.
    // Preconditions : reservantId est valide et contact est fourni.
    // Postconditions : Le contact est ajoute dans le signal _contacts.
    createContact(reservantId: number, contact: ContactDto): void {
        this._loading.set(true);
        this._contactError.set(null);
        this.contactApi.addContact(reservantId, contact).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: (c) => this._contacts.set([...this._contacts(), c]),
            error: (error) => {
                console.error('Error creating contact:', error);
                this._contactError.set(this.extractErrorMessage(error) || 'Erreur lors de la création du contact');
            },
        });
    }

    // Role : Supprimer un contact d'un reservant.
    // Preconditions : reservantId et contactId sont valides.
    // Postconditions : Le contact est retire du signal _contacts.
    deleteContact(reservantId: number, contactId: number): Observable<void> {
        this._loading.set(true);
        this._contactError.set(null);
        return this.contactApi.deleteContact(reservantId, contactId).pipe(
            tap(() => this._contacts.set(this._contacts().filter(c => c.id !== contactId))),
            map(() => undefined),
            catchError((error) => {
                console.error('Error deleting contact:', error);
                this._contactError.set(this.extractErrorMessage(error) || 'Erreur lors de la suppression du contact');
                return throwError(() => error);
            }),
            finalize(() => this._loading.set(false)),
        );
    }

    // Role : Supprimer un evenement de contact d'un reservant.
    // Preconditions : reservantId et eventId sont valides.
    // Postconditions : L'evenement est retire du signal _contactTimeline.
    deleteContactEvent(reservantId: number, eventId: number): void {
        this._loading.set(true);
        this.contactApi.deleteContactEvent(reservantId, eventId).pipe(
            finalize(() => this._loading.set(false)),
        ).subscribe({
            next: () => this._contactTimeline.set(this._contactTimeline().filter(e => e.id !== eventId)),
            error: (error) => console.error('Error deleting contact event:', error),
        });
    }

    // Role : Recharger les reservants apres une mutation.
    // Preconditions : Le festival courant peut etre null.
    // Postconditions : Retourne un Observable avec la liste actualisee.
    private fetchReservantsAfterMutation(): Observable<ReservantDto[]> {
        const festivalId = this._currentFestivalId();
        return festivalId !== null
            ? this.reservationService.getReservantsByFestival(festivalId)
            : this.api.list();
    }

    // Role : Normaliser les erreurs API pour l'affichage.
    // Preconditions : error est l'erreur renvoyee par HttpClient.
    // Postconditions : Retourne un message utilisateur ou null.
    private extractErrorMessage(error: any): string | null {
        const apiError = error?.error;
        if (typeof apiError === 'string' && apiError.trim().length > 0) {
            return apiError;
        }
        if (apiError) {
            const details = apiError.details;
            if (Array.isArray(details) && details.length > 0) {
                return details.join(' · ');
            }
            if (typeof details === 'string' && details.trim().length > 0) {
                return apiError.error ? `${apiError.error} · ${details}` : details;
            }
            if (typeof apiError.error === 'string' && apiError.error.trim().length > 0) {
                return apiError.error;
            }
        }
        if (typeof error?.message === 'string' && error.message.trim().length > 0) {
            return error.message;
        }
        if (error?.status === 409) {
            return 'Un réservant avec ce nom ou cet email existe déjà';
        }
        return null;
    }
}
