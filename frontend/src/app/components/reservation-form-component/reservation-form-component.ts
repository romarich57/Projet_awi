import { Component, inject, input, output, signal, computed, effect, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { ReservantApiService } from '../../services/reservant-api';
import { ReservantDto } from '../../types/reservant-dto';
import { ReservationDto } from '../../types/reservation-dto';
import { ReservationZoneTarifaireDto } from '../../types/reservation-zone-tarifaire-dto';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';

@Component({
  selector: 'app-reservation-form-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reservation-form-component.html',
  styleUrls: ['./reservation-form-component.scss'],
})
export class ReservationFormComponent implements OnInit {
  // Inputs
  festivalName = input<string>();
  festivalId = input<number>();
  
  // Outputs
  closeForm = output<void>();
  reservationCreated = output<void>();

  reservationService = inject(ReservationService);
  reservantService = inject(ReservantApiService);
  fb = inject(FormBuilder);

  isSubmitting = false;
  showSuccessMessage = false;
  useExistingReservant = false;
  existingReservants: ReservantDto[] = [];
  loadingReservants = false;

  // Zones tarifaires disponibles
  zonesTarifaires = signal<ZoneTarifaireDto[]>([]);
  loadingZones = false;

  reservationForm = new FormGroup({
    reservant_mode: new FormControl<'new' | 'existing'>('new'),
    existing_reservant_id: new FormControl<string | null>(null),
    reservant_name: new FormControl(''),
    reservant_email: new FormControl(''),
    reservant_type: new FormControl<'editeur' | 'prestataire' | 'boutique' | 'animateur' | 'association'>('boutique'),
    phone_number: new FormControl(''),
    address: new FormControl(''),
    siret: new FormControl(''),
    note: new FormControl(''),
    reservation_type: new FormControl<'table' | 'm2'>('table'),
    zones: this.fb.array([]),
    selected_zone_id: new FormControl<number | null>(null),
    temp_tables_standard: new FormControl(0),
    temp_tables_grande: new FormControl(0),
    temp_tables_mairie: new FormControl(0),
    temp_chaises: new FormControl(0),
    temp_surface_m2: new FormControl(0)
  });

  constructor() {
    console.log('🏗️ CONSTRUCTEUR appelé');
    console.log('🎯 Festival ID dans constructeur:', this.festivalId());
    
    this.loadExistingReservants();
    this.updateValidators();
    
    // ✅ SOLUTION 1 : Utiliser effect pour réagir aux changements de festivalId
    effect(() => {
      const festivalId = this.festivalId();
      console.log('⚡ EFFECT déclenché - Festival ID:', festivalId);
      
      if (festivalId) {
        console.log('✅ Festival ID valide, chargement des zones...');
        this.loadZonesTarifaires();
      } else {
        console.log('⚠️ Festival ID non défini, attente...');
      }
    });
  }

  // ✅ SOLUTION 2 ALTERNATIVE : Utiliser ngOnInit
  ngOnInit(): void {
    console.log('🔄 ngOnInit appelé');
    console.log('🎯 Festival ID dans ngOnInit:', this.festivalId());
    
    // Vous pouvez aussi charger ici si vous préférez
    // this.loadZonesTarifaires();
  }

  get zonesArray(): FormArray {
    return this.reservationForm.get('zones') as FormArray;
  }

  calculatedPrice = computed(() => {
    let total = 0;
    const zones = this.zonesArray.value;
    
    zones.forEach((zone: any) => {
      const zoneInfo = this.zonesTarifaires().find(z => z.id === zone.zone_tarifaire_id);
      if (!zoneInfo) return;
      
      if (zone.mode_paiement === 'table') {
        const totalTables = 
          (zone.nb_tables_standard || 0) + 
          (zone.nb_tables_grande || 0) + 
          (zone.nb_tables_mairie || 0);
        total += totalTables * zoneInfo.price_per_table;
      } else {
        total += (zone.surface_m2 || 0) * zoneInfo.m2_price;
      }
    });
    
    return total;
  });

  totalTablesEquivalent = computed(() => {
    let total = 0;
    const zones = this.zonesArray.value;
    
    zones.forEach((zone: any) => {
      if (zone.mode_paiement === 'table') {
        total += 
          (zone.nb_tables_standard || 0) + 
          (zone.nb_tables_grande || 0) + 
          (zone.nb_tables_mairie || 0);
      } else {
        total += Math.ceil((zone.surface_m2 || 0) / 4);
      }
    });
    
    return total;
  });

  totalM2Equivalent = computed(() => {
    let total = 0;
    const zones = this.zonesArray.value;
    
    zones.forEach((zone: any) => {
      if (zone.mode_paiement === 'table') {
        total += 
          ((zone.nb_tables_standard || 0) + 
           (zone.nb_tables_grande || 0) + 
           (zone.nb_tables_mairie || 0)) * 4;
      } else {
        total += (zone.surface_m2 || 0);
      }
    });
    
    return total;
  });

  loadExistingReservants(): void {
    this.loadingReservants = true;
    this.reservantService.list().subscribe({
      next: (reservants) => {
        this.existingReservants = reservants;
        this.loadingReservants = false;
        console.log('✅ Réservants chargés:', reservants.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement réservants:', error);
        this.loadingReservants = false;
      }
    });
  }

  loadZonesTarifaires(): void {
    const festivalId = this.festivalId();
    
    console.log('🎯 === DÉBUT loadZonesTarifaires ===');
    console.log('🎯 Festival ID:', festivalId);
    console.log('🎯 Type:', typeof festivalId);
    
    if (!festivalId) {
      console.error('❌ Festival ID non défini - ARRÊT');
      return;
    }
    
    this.loadingZones = true;
    console.log('🌐 Appel API zones-tarifaires pour festival:', festivalId);
    
    this.reservationService.getZonesTarifaires(festivalId).subscribe({
      next: (zones: ZoneTarifaireDto[]) => {
        console.log('✅ SUCCESS - Zones reçues:', zones);
        console.log('✅ Nombre de zones:', zones.length);
        this.zonesTarifaires.set(zones);
        this.loadingZones = false;
      },
      error: (error: any) => {
        console.error('❌ ERROR DÉTAILLÉ:');
        console.error('  - Status:', error.status);
        console.error('  - Message:', error.message);
        console.error('  - URL:', error.url);
        console.error('  - Body:', error.error);
        console.error('  - Objet complet:', error);
        this.loadingZones = false;
      },
      complete: () => {
        console.log('✅ Observable complete');
      }
    });
  }

  onModeChange(): void {
    const mode = this.reservationForm.get('reservant_mode')?.value;
    this.useExistingReservant = mode === 'existing';
    console.log('Mode changé vers:', mode);
    this.updateValidators();
    
    this.reservationForm.patchValue({
      existing_reservant_id: null,
      reservant_name: '',
      reservant_email: '',
      reservant_type: 'boutique',
      phone_number: '',
      address: '',
      siret: ''
    });
  }

  updateValidators(): void {
    const nameControl = this.reservationForm.get('reservant_name');
    const emailControl = this.reservationForm.get('reservant_email');
    const typeControl = this.reservationForm.get('reservant_type');
    const existingControl = this.reservationForm.get('existing_reservant_id');

    if (this.isExistingMode) {
      existingControl?.setValidators([Validators.required]);
      nameControl?.clearValidators();
      emailControl?.clearValidators();
      typeControl?.clearValidators();
    } else {
      existingControl?.clearValidators();
      nameControl?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      typeControl?.setValidators([Validators.required]);
    }

    existingControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
    typeControl?.updateValueAndValidity();
  }

  get isExistingMode(): boolean {
    return this.reservationForm.get('reservant_mode')?.value === 'existing';
  }

  addZone(): void {
    const zoneId = this.reservationForm.get('selected_zone_id')?.value;
    if (!zoneId) return;
    
    const alreadyAdded = this.zonesArray.controls.some(
      (control: any) => control.value.zone_tarifaire_id === zoneId
    );
    
    if (alreadyAdded) {
      alert('Cette zone est déjà ajoutée');
      return;
    }
    
    const reservationType = this.reservationForm.get('reservation_type')?.value;
    const tempTablesStandard = this.reservationForm.get('temp_tables_standard')?.value || 0;
    const tempTablesGrande = this.reservationForm.get('temp_tables_grande')?.value || 0;
    const tempTablesMairie = this.reservationForm.get('temp_tables_mairie')?.value || 0;
    const tempChaises = this.reservationForm.get('temp_chaises')?.value || 0;
    const tempSurfaceM2 = this.reservationForm.get('temp_surface_m2')?.value || 0;
    
    if (reservationType === 'table' && 
        tempTablesStandard === 0 && 
        tempTablesGrande === 0 && 
        tempTablesMairie === 0) {
      alert('Veuillez spécifier au moins une table');
      return;
    }
    
    if (reservationType === 'm2' && tempSurfaceM2 === 0) {
      alert('Veuillez spécifier une surface');
      return;
    }
    
    const zoneGroup = this.fb.group({
      zone_tarifaire_id: [zoneId],
      mode_paiement: [reservationType],
      nb_tables_standard: [reservationType === 'table' ? tempTablesStandard : 0],
      nb_tables_grande: [reservationType === 'table' ? tempTablesGrande : 0],
      nb_tables_mairie: [reservationType === 'table' ? tempTablesMairie : 0],
      nb_chaises: [reservationType === 'table' ? tempChaises : 0],
      surface_m2: [reservationType === 'm2' ? tempSurfaceM2 : 0]
    });
    
    this.zonesArray.push(zoneGroup);
    
    this.reservationForm.patchValue({
      selected_zone_id: null,
      temp_tables_standard: 0,
      temp_tables_grande: 0,
      temp_tables_mairie: 0,
      temp_chaises: 0,
      temp_surface_m2: 0
    });
  }

  removeZone(index: number): void {
    this.zonesArray.removeAt(index);
  }

  getZoneName(zoneId: number): string {
    const zone = this.zonesTarifaires().find(z => z.id === zoneId);
    return zone ? zone.name : 'Zone inconnue';
  }

  calculateZonePrice(zoneData: any): number {
    const zone = this.zonesTarifaires().find(z => z.id === zoneData.zone_tarifaire_id);
    if (!zone) return 0;
    
    if (zoneData.mode_paiement === 'table') {
      const totalTables = 
        (zoneData.nb_tables_standard || 0) + 
        (zoneData.nb_tables_grande || 0) + 
        (zoneData.nb_tables_mairie || 0);
      return totalTables * zone.price_per_table;
    } else {
      return (zoneData.surface_m2 || 0) * zone.m2_price;
    }
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
      
      if (this.zonesArray.length === 0) {
        alert('Veuillez ajouter au moins une zone tarifaire');
        this.isSubmitting = false;
        return;
      }

      let reservationData: any;

      if (formValues.reservant_mode === 'existing' && formValues.existing_reservant_id) {
        const reservantId = Number(formValues.existing_reservant_id);
        const selectedReservant = this.existingReservants.find(r => r.id === reservantId);
        
        if (!selectedReservant) {
          console.error('Réservant sélectionné introuvable. ID:', reservantId);
          this.isSubmitting = false;
          return;
        }
        
        reservationData = {
          reservant_name: selectedReservant.name,
          reservant_email: selectedReservant.email,
          reservant_type: selectedReservant.type,
          phone_number: selectedReservant.phone_number || '',
          address: selectedReservant.address || '',
          siret: selectedReservant.siret || '',
          note: formValues.note || '',
          festival_id: festivalId,
          start_price: 0,
          nb_prises: 1,
          final_price: 0,
          table_discount_offered: 0,
          direct_discount: 0,
          zones: this.transformZonesForBackend()
        };
      } else {
        reservationData = {
          reservant_name: formValues.reservant_name,
          reservant_email: formValues.reservant_email,
          reservant_type: formValues.reservant_type,
          phone_number: formValues.phone_number || '',
          address: formValues.address || '',
          siret: formValues.siret || '',
          note: formValues.note || '',
          festival_id: festivalId,
          start_price: 0,
          nb_prises: 1,
          final_price: 0,
          table_discount_offered: 0,
          direct_discount: 0,
          zones: this.transformZonesForBackend()
        };
      }

      console.log('📤 Données envoyées:', reservationData);

      this.reservationService.createReservation(reservationData).subscribe({
        next: (response) => {
          console.log('✅ Réservation créée:', response);
          this.showSuccessMessage = true;
          this.reservationCreated.emit();
          setTimeout(() => {
            this.closeForm.emit();
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Erreur création réservation:', error);
          this.isSubmitting = false;
          
          if (error.error?.error) {
            alert(`Erreur: ${error.error.error}\n${error.error.details || ''}`);
          }
        }
      });
    } else {
      Object.keys(this.reservationForm.controls).forEach(key => {
        this.reservationForm.get(key)?.markAsTouched();
      });
    }
  }

  private transformZonesForBackend(): any[] {
    return this.zonesArray.value.map((zone: any) => {
      const baseZone = {
        zone_tarifaire_id: zone.zone_tarifaire_id,
        mode_paiement: zone.mode_paiement as 'table' | 'm2'
      };
      
      if (zone.mode_paiement === 'table') {
        const totalTables = 
          (zone.nb_tables_standard || 0) + 
          (zone.nb_tables_grande || 0) + 
          (zone.nb_tables_mairie || 0);
        
        return {
          ...baseZone,
          nb_tables_reservees: totalTables,
          nb_tables_standard: zone.nb_tables_standard || 0,
          nb_tables_grande: zone.nb_tables_grande || 0,
          nb_tables_mairie: zone.nb_tables_mairie || 0,
          nb_chaises: zone.nb_chaises || 0
        };
      } else {
        return {
          ...baseZone,
          surface_m2: zone.surface_m2 || 0
        };
      }
    });
  }
}