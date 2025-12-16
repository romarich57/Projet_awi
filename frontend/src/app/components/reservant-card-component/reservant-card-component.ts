import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservantDto, ReservantWorkflowState } from '../../types/reservant-dto';
import { ReservantStore } from '../../stores/reservant.store';
import { GameApiService } from '../../services/game-api';
import { AllocatedGamesApiService } from '../../services/allocated-games-api';
import type { GameDto } from '../../types/game-dto';
import type { AllocatedGameDto, TableSize } from '../../types/allocated-game-dto';
@Component({
  selector: 'app-reservant-card-component',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './reservant-card-component.html',
  styleUrl: './reservant-card-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservantCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly reservantStore = inject(ReservantStore);
  private readonly gameApi = inject(GameApiService);
  private readonly allocatedGamesApi = inject(AllocatedGamesApiService);

  readonly reservantInput = input<ReservantDto | null>(null, { alias: 'reservant' });
  private readonly reservantIdParam = this.route.snapshot.paramMap.get('id');
  readonly reservantId = this.reservantIdParam ? Number(this.reservantIdParam) : null;
  readonly isPageContext = this.reservantId !== null;
  festivalId: number | null = null;

  readonly availableGames = signal<GameDto[]>([]);
  readonly allocatedGames = signal<AllocatedGameDto[]>([]);
  readonly allocationsLoading = signal(false);
  readonly allocationsError = signal<string | null>(null);
  selectedFestival = '';
  gameSearch = '';
  allocationForm = {
    game_id: '',
    nb_exemplaires: 1,
    nb_tables_occupees: 1,
    taille_table_requise: 'standard' as TableSize,
    zone_plan_id: '',
  };
  editingAllocationId: number | null = null;
  allocationEditForm = {
    nb_exemplaires: 1,
    nb_tables_occupees: 1,
    taille_table_requise: 'standard' as TableSize,
    zone_plan_id: '',
  };

  get filteredGames(): GameDto[] {
    const term = this.gameSearch.toLowerCase();
    const games = this.availableGames();
    if (!term) return games;
    return games.filter((g) => g.title.toLowerCase().includes(term));
  }

  readonly reservant = computed(() => {
    if (this.reservantInput()) {
      return this.reservantInput();
    }
    if (this.reservantId === null) {
      return null;
    }
    return this.reservantStore.reservants().find((r) => r.id === this.reservantId) ?? null;
  });
  readonly contacts = computed(() => this.reservantStore.contacts());
  readonly contactTimeline = computed(() => this.reservantStore.contactTimeline());
  contactDate = '';
  selectedContactId: number | null = null;
  contactForm = {
    name: '',
    email: '',
    phone_number: '',
    job_title: '',
    priority: 1,
  };

  ngOnInit(): void {
    const currentId = this.reservantId ?? this.reservantInput()?.id ?? null;
    if (!this.reservantInput() && currentId !== null) {
      this.reservantStore.loadById(currentId);
    }
    if (currentId !== null) {
      this.reservantStore.loadContacts(currentId);
      this.reservantStore.loadContactTimeline(currentId);
    }
    this.loadAvailableGames();
  }

  readonly workflowStates: { value: ReservantWorkflowState; label: string }[] = [
    { value: 'Pas_de_contact', label: 'Pas de contact' },
    { value: 'Contact_pris', label: 'Contact pris' },
    { value: 'Discussion_en_cours', label: 'Discussion en cours' },
    { value: 'Sera_absent', label: 'Sera absent' },
    { value: 'Considere_absent', label: 'Considere absent' },
    { value: 'Reservation_confirmee', label: 'Reservation confirmee' },
    { value: 'Facture', label: 'Facture' },
    { value: 'Facture_payee', label: 'Facture payee' },
  ];
  readonly workflowFlags = [
    { key: 'liste_jeux_demandee' as const, label: 'Liste des jeux demandee' },
    { key: 'liste_jeux_obtenue' as const, label: 'Liste des jeux obtenue' },
    { key: 'jeux_recus' as const, label: 'Jeux recus' },
    { key: 'presentera_jeux' as const, label: 'Presentera ses jeux' },
  ];

  typeLabel(type: ReservantDto['type']): string {
    const labels: Record<ReservantDto['type'], string> = {
      editeur: 'Éditeur',
      prestataire: 'Prestataire',
      boutique: 'Boutique',
      animateur: 'Animateur',
      association: 'Association',
    };
    return labels[type];
  }

  workflowStateLabel(state: ReservantWorkflowState): string {
    const match = this.workflowStates.find((workflowState) => workflowState.value === state);
    return match ? match.label : state;
  }

  onWorkflowStateChange(newState: string): void {
    const id = this.reservant()?.id ?? this.reservantId;
    if (id == null) {
      return;
    }
    if (this.festivalId !== null) {
      this.reservantStore.setFestival(this.festivalId);
    }
    this.reservantStore.changeWorkflowState(id, newState as ReservantWorkflowState);
  }

  onWorkflowFlagToggle(flagKey: typeof this.workflowFlags[number]['key'], value: boolean): void {
    const id = this.reservant()?.id ?? this.reservantId;
    if (id == null) {
      return;
    }
    if (this.festivalId !== null) {
      this.reservantStore.setFestival(this.festivalId);
    }
    this.reservantStore.updateWorkflowFlags(id, { [flagKey]: value });
  }

  workflowFlagValue(reservant: ReservantDto | null, key: typeof this.workflowFlags[number]['key']): boolean {
    return !!reservant?.[key];
  }

  onSelectContact(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedContactId = value ? Number(value) : null;
  }

  onContactDateChange(event: Event): void {
    this.contactDate = (event.target as HTMLInputElement).value;
  }

  addContactEvent(): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
    if (reservantId == null || this.selectedContactId == null) {
      return;
    }
    const dateContact = this.contactDate || new Date().toISOString();
    this.reservantStore.addContactEvent(reservantId, this.selectedContactId, dateContact);
    this.contactDate = '';
    this.selectedContactId = null;
  }

  createContact(): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
    if (reservantId == null) {
      return;
    }
    this.reservantStore.createContact(reservantId, {
      ...this.contactForm,
      priority: Number(this.contactForm.priority) || 1,
    });
    this.contactForm = { name: '', email: '', phone_number: '', job_title: '', priority: 1 };
  }

  deleteContact(contactId: number): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
    if (reservantId == null) {
      return;
    }
    this.reservantStore.deleteContact(reservantId, contactId);
  }

  deleteContactEvent(eventId: number): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
    if (reservantId == null) {
      return;
    }
    this.reservantStore.deleteContactEvent(reservantId, eventId);
  }

  loadAvailableGames(): void {
    this.gameApi.list().subscribe({
      next: (games) => this.availableGames.set(games),
      error: (err) => console.error('Erreur lors du chargement des jeux', err),
    });
  }

  loadAllocatedGames(): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
    const festivalId = Number(this.selectedFestival);
    if (reservantId == null) {
      return;
    }
    if (!Number.isFinite(festivalId)) {
      this.allocationsError.set('Indiquez un festival pour charger les jeux associés.');
      return;
    }
    this.allocationsLoading.set(true);
    this.allocationsError.set(null);
    this.allocatedGamesApi
      .list(festivalId, reservantId)
      .subscribe({
        next: (items) => this.allocatedGames.set(items),
        error: (err) => {
          if (err.status === 404) {
            this.allocatedGames.set([]);
            this.allocationsError.set('Aucune réservation pour ce festival et ce réservant.');
          } else {
            this.allocationsError.set(err.message || 'Erreur lors du chargement des jeux alloués');
          }
        },
      })
      .add(() => this.allocationsLoading.set(false));
  }

  addAllocation(): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
    const festivalId = Number(this.selectedFestival);
    const form = this.allocationForm;
    if (reservantId == null) return;
    if (!form.game_id) {
      this.allocationsError.set('Choisissez un jeu à ajouter');
      return;
    }
    if (!Number.isFinite(festivalId)) {
      this.allocationsError.set('Indiquez un festival pour ajouter un jeu.');
      return;
    }

    const payload = {
      game_id: Number(form.game_id),
      nb_exemplaires: Number(form.nb_exemplaires) || 1,
      nb_tables_occupees: Number(form.nb_tables_occupees) || 1,
      zone_plan_id: form.zone_plan_id ? Number(form.zone_plan_id) : null,
      taille_table_requise: form.taille_table_requise as TableSize,
    };

    this.allocationsLoading.set(true);
    this.allocationsError.set(null);
    this.allocatedGamesApi
      .add(festivalId, reservantId, payload)
      .subscribe({
        next: (created) => {
          this.allocatedGames.set([created, ...this.allocatedGames()]);
          this.allocationForm = {
            game_id: '',
            nb_exemplaires: 1,
            nb_tables_occupees: 1,
            taille_table_requise: 'standard',
            zone_plan_id: '',
          };
        },
        error: (err) => {
          this.allocationsError.set(
            err.status === 409
              ? 'Ce jeu est déjà lié à cette réservation'
              : err.message || 'Erreur lors de l\'ajout du jeu',
          );
        },
      })
      .add(() => this.allocationsLoading.set(false));
  }

  startEditAllocation(allocation: AllocatedGameDto): void {
    this.editingAllocationId = allocation.allocation_id;
    this.allocationEditForm = {
      nb_exemplaires: allocation.nb_exemplaires,
      nb_tables_occupees: allocation.nb_tables_occupees,
      taille_table_requise: allocation.taille_table_requise,
      zone_plan_id: allocation.zone_plan_id ? String(allocation.zone_plan_id) : '',
    };
  }

  submitAllocationUpdate(): void {
    const allocationId = this.editingAllocationId;
    if (allocationId == null) return;
    const form = this.allocationEditForm;
    const payload = {
      nb_exemplaires: Number(form.nb_exemplaires) || 1,
      nb_tables_occupees: Number(form.nb_tables_occupees) || 1,
      zone_plan_id: form.zone_plan_id ? Number(form.zone_plan_id) : null,
      taille_table_requise: form.taille_table_requise as TableSize,
    };

    this.allocationsLoading.set(true);
    this.allocationsError.set(null);
    this.allocatedGamesApi
      .update(allocationId, payload)
      .subscribe({
        next: (updated) => {
          this.allocatedGames.set(
            this.allocatedGames().map((item) =>
              item.allocation_id === allocationId ? updated : item,
            ),
          );
          this.editingAllocationId = null;
        },
        error: (err) => {
          this.allocationsError.set(err.message || 'Erreur lors de la mise à jour');
        },
      })
      .add(() => this.allocationsLoading.set(false));
  }

  cancelAllocationEdit(): void {
    this.editingAllocationId = null;
  }

  deleteAllocation(allocationId: number): void {
    if (!confirm('Retirer ce jeu de la réservation ?')) return;
    this.allocationsError.set(null);
    this.allocatedGamesApi.delete(allocationId).subscribe({
      next: () => {
        this.allocatedGames.set(
          this.allocatedGames().filter((item) => item.allocation_id !== allocationId),
        );
      },
      error: (err) => {
        this.allocationsError.set(err.message || 'Erreur lors de la suppression');
      },
    });
  }

  displayValue(value?: string | null): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '-';
  }

}
