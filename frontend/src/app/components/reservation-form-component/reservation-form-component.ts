import { Component, inject, input, output, OnInit, SimpleChanges, effect, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { ReservantApiService } from '../../services/reservant-api';
import { ReservantDto } from '../../types/reservant-dto';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-reservation-form-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reservation-form-component.html',
  styleUrls: ['./reservation-form-component.scss'],
})
export class ReservationFormComponent {

  readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser();

  // Inputs
  festivalName = input<string>();
  festivalId = input<number>();
  readOnly = computed(() => {
    return this.currentUser?.role !== 'admin' && this.currentUser?.role !== 'super-organizer';
  });

  // Outputs
  closeForm = output<void>();
  reservationCreated = output<void>();

  reservationService = inject(ReservationService);
  reservantService = inject(ReservantApiService);

  isSubmitting = false;
  showSuccessMessage = false;
  useExistingReservant = false;
  existingReservants: ReservantDto[] = [];
  loadingReservants = false;

  reservationForm = new FormGroup({
    // Mode de sélection du réservant
    reservant_mode: new FormControl<'new' | 'existing'>('new'),
    // Sélection du réservant existant
    existing_reservant_id: new FormControl<string | null>(null),
    represent_editor: new FormControl<'no' | 'yes'>('no'),
    represented_editor_id: new FormControl<string | null>(null),
    // Informations du réservant (pour nouveau réservant)
    reservant_name: new FormControl(''),
    reservant_email: new FormControl(''),
    reservant_type: new FormControl<'editeur' | 'prestataire' | 'boutique' | 'animateur' | 'association'>('boutique'),
    phone_number: new FormControl(''),
    address: new FormControl(''),
    siret: new FormControl(''),
    note: new FormControl('')
  });

  constructor() {
    this.loadExistingReservants();
    this.updateValidators();
    this.setupRepresentedEditorWatchers();
  }

  private setupRepresentedEditorWatchers(): void {
    this.reservationForm.get('reservant_type')?.valueChanges.subscribe(() => {
      this.handleRepresentedEditorVisibility();
    });
    this.reservationForm.get('existing_reservant_id')?.valueChanges.subscribe(() => {
      this.handleRepresentedEditorVisibility();
    });
    this.reservationForm.get('represent_editor')?.valueChanges.subscribe(() => {
      this.updateRepresentedEditorValidators();
      if (this.reservationForm.get('represent_editor')?.value === 'no') {
        this.reservationForm.patchValue({ represented_editor_id: null }, { emitEvent: false });
      }
    });
  }




  loadExistingReservants(): void {
    this.loadingReservants = true;
    this.reservantService.list().subscribe({
      next: (reservants) => {
        this.existingReservants = reservants;
        this.loadingReservants = false;
        console.log('Réservants chargés:', reservants.length, reservants);
        this.handleRepresentedEditorVisibility();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réservants:', error);
        this.loadingReservants = false;
      }
    });
  }

  onModeChange(): void {
    const mode = this.reservationForm.get('reservant_mode')?.value;
    this.useExistingReservant = mode === 'existing';
    console.log('Mode changé vers:', mode, 'useExistingReservant:', this.useExistingReservant);
    this.updateValidators();
    
    // Réinitialiser les valeurs
    this.reservationForm.patchValue({
      existing_reservant_id: null,
      represent_editor: 'no',
      represented_editor_id: null,
      reservant_name: '',
      reservant_email: '',
      reservant_type: 'boutique',
      phone_number: '',
      address: '',
      siret: ''
    });
    this.handleRepresentedEditorVisibility();
  }

  updateValidators(): void {
    const nameControl = this.reservationForm.get('reservant_name');
    const emailControl = this.reservationForm.get('reservant_email');
    const typeControl = this.reservationForm.get('reservant_type');
    const existingControl = this.reservationForm.get('existing_reservant_id');

    if (this.isExistingMode) {
      // Mode réservant existant
      existingControl?.setValidators([Validators.required]);
      nameControl?.clearValidators();
      emailControl?.clearValidators();
      typeControl?.clearValidators();
    } else {
      // Mode nouveau réservant
      existingControl?.clearValidators();
      nameControl?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      typeControl?.setValidators([Validators.required]);
    }

    // Mettre à jour la validation
    existingControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
    typeControl?.updateValueAndValidity();

    this.updateRepresentedEditorValidators();
  }

  get isExistingMode(): boolean {
    return this.reservationForm.get('reservant_mode')?.value === 'existing';
  }

  get editorReservants(): ReservantDto[] {
    return this.existingReservants.filter(reservant => reservant.type === 'editeur');
  }

  get selectedReservantType(): ReservantDto['type'] | null {
    if (this.isExistingMode) {
      const existingId = this.reservationForm.get('existing_reservant_id')?.value;
      if (!existingId) return null;
      const selected = this.existingReservants.find(r => r.id === Number(existingId));
      return selected?.type ?? null;
    }
    return this.reservationForm.get('reservant_type')?.value ?? null;
  }

  shouldShowRepresentedEditorQuestion(): boolean {
    const type = this.selectedReservantType;
    return type === 'animateur' || type === 'prestataire' || type === 'association';
  }

  onReservantTypeChange(): void {
    this.handleRepresentedEditorVisibility();
  }

  onExistingReservantChange(): void {
    this.handleRepresentedEditorVisibility();
  }

  onRepresentEditorChange(): void {
    this.updateRepresentedEditorValidators();
  }

  private handleRepresentedEditorVisibility(): void {
    if (!this.shouldShowRepresentedEditorQuestion()) {
      this.reservationForm.patchValue(
        { represent_editor: 'no', represented_editor_id: null },
        { emitEvent: false }
      );
    }
    this.updateRepresentedEditorValidators();
  }

  private updateRepresentedEditorValidators(): void {
    const representedEditorControl = this.reservationForm.get('represented_editor_id');
    const shouldShow = this.shouldShowRepresentedEditorQuestion();
    const shouldRequire = this.reservationForm.get('represent_editor')?.value === 'yes';

    if (shouldShow && shouldRequire) {
      representedEditorControl?.setValidators([Validators.required]);
    } else {
      representedEditorControl?.clearValidators();
    }
    representedEditorControl?.updateValueAndValidity();
  }



  cancel(): void {
    this.closeForm.emit();
  }

  onSubmit(): void {
    if (this.reservationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const festivalId = this.festivalId();
      
      if (!festivalId) {
        console.error('Festival ID is required');
        this.isSubmitting = false;
        return;
      }

      const formValues = this.reservationForm.value;
      let reservation;
      const representedEditorId =
        formValues.represent_editor === 'yes' && formValues.represented_editor_id
          ? Number(formValues.represented_editor_id)
          : null;

      if (formValues.reservant_mode === 'existing' && formValues.existing_reservant_id) {
        // Utiliser un réservant existant
        const reservantId = Number(formValues.existing_reservant_id);
        console.log('ID recherché:', reservantId, 'Type:', typeof reservantId);
        console.log('Réservants disponibles:', this.existingReservants.map(r => ({id: r.id, name: r.name, type: typeof r.id})));
        
        const selectedReservant = this.existingReservants.find(r => r.id === reservantId);
        if (!selectedReservant) {
          console.error('Réservant sélectionné introuvable. ID recherché:', reservantId);
          this.isSubmitting = false;
          return;
        }
        
        console.log('Réservant trouvé:', selectedReservant);
        
        reservation = {
          reservant_name: selectedReservant.name,
          reservant_email: selectedReservant.email,
          reservant_type: selectedReservant.type,
          phone_number: selectedReservant.phone_number || '',
          address: selectedReservant.address || '',
          siret: selectedReservant.siret || '',
          note: formValues.note || '',
          represented_editor_id: representedEditorId,
          festival_id: festivalId,
          // Prix par défaut à 0
          start_price: 0,
          nb_prises: 1,
          final_price: 0,
          table_discount_offered: 0,
          direct_discount: 0,
          zones_tarifaires: [] // Par défaut vide, sera modifié plus tard
        };
      } else {
        // Créer un nouveau réservant
        reservation = {
          reservant_name: formValues.reservant_name,
          reservant_email: formValues.reservant_email,
          reservant_type: formValues.reservant_type,
          phone_number: formValues.phone_number || '',
          address: formValues.address || '',
          siret: formValues.siret || '',
          note: formValues.note || '',
          represented_editor_id: representedEditorId,
          festival_id: festivalId,
          // Prix par défaut à 0
          start_price: 0,
          nb_prises: 1,
          final_price: 0,
          table_discount_offered: 0,
          direct_discount: 0,
          zones_tarifaires: [] // Par défaut vide, sera modifié plus tard
        };
      }

      this.reservationService.createReservation(reservation).subscribe({
        next: (response) => {
          console.log('Réservation créée:', response);
          this.showSuccessMessage = true;
          this.reservationCreated.emit();
          setTimeout(() => {
            this.closeForm.emit();
          }, 2000);
        },
        error: (error) => {
          console.error('Erreur lors de la création de la réservation:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.reservationForm.controls).forEach(key => {
        this.reservationForm.get(key)?.markAsTouched();
      });
    }


    //on reloade la liste des réservations après création
    


  }
}
