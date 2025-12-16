import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
export class ReservantFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly fb = inject(FormBuilder);
  readonly reservantStore = inject(ReservantStore);

  private readonly reservantIdParam = this.route.snapshot.paramMap.get('id');
  readonly reservantId = this.reservantIdParam ? Number(this.reservantIdParam) : null;
  readonly isEditContext = this.reservantId !== null;

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
    const id = this.reservantId;
    if (id === null) {
      return null;
    }
    return this.reservantStore.reservants().find((r) => r.id === id) ?? null;
  });

  constructor() {
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

  ngOnInit(): void {
    if (this.reservantId !== null) {
      this.reservantStore.loadById(this.reservantId);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    // Mode création
    if (this.reservantId === null) {
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
      id: this.reservantId,
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
      next: () => this.router.navigate(['/reservants', this.reservantId]),
      error: (error) => console.error('Error updating reservant', error),
    });
  }

  cancel(): void {
    this.location.back();
  }

  controlError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }
}
