import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservantDto, ReservantWorkflowState } from '../../types/reservant-dto';
import { ReservantStore } from '../../stores/reservant.store';
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

  readonly reservantInput = input<ReservantDto | null>(null, { alias: 'reservant' });
  private readonly reservantIdParam = this.route.snapshot.paramMap.get('id');
  readonly reservantId = this.reservantIdParam ? Number(this.reservantIdParam) : null;
  readonly isPageContext = this.reservantId !== null;
  festivalId: number | null = null;

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

  displayValue(value?: string | null): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '-';
  }

}
