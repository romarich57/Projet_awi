import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservantStore } from '../../stores/reservant.store';
import { ReservantDto } from '../../types/reservant-dto';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-reservant-form-component',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './reservant-form-component.html',
  styleUrl: './reservant-form-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Role : Gerer le formulaire de creation/edition d'un reservant.
// Préconditions : Les services et la route sont disponibles; l'id peut etre present.
// Postconditions : Le reservant est cree ou mis a jour selon le contexte.
export class ReservantFormComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly fb = inject(FormBuilder);
  readonly reservantStore = inject(ReservantStore);

  readonly reservantIdParam = input<string | null>(null, { alias: 'id' });
  readonly reservantId = computed(() => {
    const idParam = this.reservantIdParam();
    if (!idParam) {
      return null;
    }
    const parsed = Number(idParam);
    return Number.isNaN(parsed) ? null : parsed;
  });

  readonly form = this.fb.nonNullable.group({
    name: this.fb.control<string>('', { validators: [Validators.required] }),
    email: this.fb.control<string>('', { validators: [Validators.required, Validators.email] }),
    type: this.fb.control<ReservantDto['type'] | ''>('', { validators: [Validators.required] }),
    phone_number: this.fb.control<string>(''),
    address: this.fb.control<string>(''),
    siret: this.fb.control<string>(''),
    notes: this.fb.control<string>(''),
  });

  readonly reservant = computed(() => {
    const id = this.reservantId();
    if (id === null) {
      return null;
    }
    return this.reservantStore.reservants().find((r) => r.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const id = this.reservantId();
      if (id !== null) {
        this.reservantStore.loadById(id);
      }
    });

    effect(() => {
      const reservant = this.reservant();
      if (reservant) {
        this.form.patchValue({
          name: reservant.name,
          email: reservant.email ?? '',
          type: reservant.type,
          phone_number: reservant.phone_number ?? '',
          address: reservant.address ?? '',
          siret: reservant.siret ?? '',
          notes: reservant.notes ?? '',
        });
      }
    });
  }

  get isEditContext(): boolean {
    return this.reservantId() !== null;
  }

  // Role : Soumettre le formulaire en creation ou en edition.
  // Préconditions : Le formulaire est valide.
  // Postconditions : Le reservant est cree ou mis a jour et la navigation est lancee.
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const reservantId = this.reservantId();

    // Mode création
    if (reservantId === null) {
      const payload: Partial<ReservantDto> = {
        name: value.name || '',
        email: value.email || '',
        type: value.type as ReservantDto['type'],
        phone_number: value.phone_number || undefined,
        address: value.address || undefined,
        siret: value.siret || undefined,
        notes: value.notes || undefined,
        workflow_state: 'Pas_de_contact' // Default workflow state for new reservants
      };

      this.reservantStore.create(payload as ReservantDto);
      // Navigate to list after creation
      this.router.navigate(['/reservants']);
      return;
    }

    // Mode édition
    const currentReservant = this.reservant();
    const payload: ReservantDto = {
      id: reservantId,
      name: value.name || '',
      email: value.email || '',
      type: value.type as ReservantDto['type'],
      phone_number: value.phone_number || undefined,
      address: value.address || undefined,
      siret: value.siret || undefined,
      notes: value.notes || undefined,
      workflow_state: currentReservant?.workflow_state || 'Pas_de_contact' // Preserve existing workflow state
    };

    this.reservantStore.update(payload).subscribe({
      next: () => this.router.navigate(['/reservants', reservantId]),
      error: (error) => console.error('Error updating reservant', error),
    });
  }

  // Role : Annuler la saisie et revenir a l'ecran precedent.
  // Préconditions : L'historique de navigation est disponible.
  // Postconditions : La navigation retour est declenchee.
  cancel(): void {
    this.location.back();
  }

  // Role : Verifier si un controle a une erreur donnee.
  // Préconditions : Le nom de controle et le code d'erreur sont fournis.
  // Postconditions : Retourne true si l'erreur doit etre affichee.
  controlError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }
}
