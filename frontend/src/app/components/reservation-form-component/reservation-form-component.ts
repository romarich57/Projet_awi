import { Component, inject, input, output, signal, computed, effect, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { ReservantApiService } from '../../services/reservant-api';
import { StockService, TableStock } from '../../services/stock-service';
import { ReservantDto } from '../../types/reservant-dto';
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
  stockService = inject(StockService);
  fb = inject(FormBuilder);

  isSubmitting = false;
  showSuccessMessage = false;
  useExistingReservant = false;
  existingReservants: ReservantDto[] = [];
  loadingReservants = false;

  // Zones tarifaires disponibles
  zonesTarifaires = signal<ZoneTarifaireDto[]>([]);
  loadingZones = false;

  // Stock disponible
  stockData: any = null;
  loadingStock = false;

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
    this.loadExistingReservants();
    this.updateValidators();
    
    effect(() => {
      const festivalId = this.festivalId();
      console.log('⚡ EFFECT déclenché - Festival ID:', festivalId);
      
      if (festivalId) {
        console.log('✅ Festival ID valide, chargement...');
        this.loadZonesTarifaires();
        this.loadStock();
      }
    });
  }

  ngOnInit(): void {
    console.log('🔄 ngOnInit appelé');
  }

  get zonesArray(): FormArray {
    return this.reservationForm.get('zones') as FormArray;
  }

  // Calculer les tables déjà réservées dans le formulaire
  getTablesAlreadyReserved(): number {
    let total = 0;
    const zones = this.zonesArray.value;
    
    zones.forEach((zone: any) => {
      if (zone.mode_paiement === 'table') {
        total += 
          (zone.nb_tables_standard || 0) + 
          (zone.nb_tables_grande || 0) + 
          (zone.nb_tables_mairie || 0);
      }
    });
    
    console.log('📊 Tables déjà dans le formulaire:', total);
    return total;
  }

  // Obtenir le stock disponible
  getAvailableTables(): number {
    console.log('📦 === CALCUL STOCK DISPONIBLE ===');
    console.log('📦 stockData:', this.stockData);
    
    if (!this.stockData?.tables) {
      console.warn('⚠️ Pas de données de stock !');
      return 0;
    }
    
    const totalAvailable = this.stockData.tables.reduce(
      (sum: number, t: TableStock) => sum + t.available, 
      0
    );
    
    console.log('📦 Total disponible (stock):', totalAvailable);
    
    const alreadyInForm = this.getTablesAlreadyReserved();
    console.log('📦 Déjà dans le formulaire:', alreadyInForm);
    
    const remaining = Math.max(0, totalAvailable - alreadyInForm);
    console.log('📦 Restant:', remaining);
    
    return remaining;
  }

  // Charger le stock
  loadStock(): void {
    const festivalId = this.festivalId();
    if (!festivalId) {
      console.error('❌ Pas de festival ID pour charger le stock');
      return;
    }
    
    this.loadingStock = true;
    console.log('📦 Chargement du stock pour festival:', festivalId);
    
    this.stockService.getStock(festivalId).subscribe({
      next: (data) => {
        console.log('✅ Stock chargé avec succès:', data);
        this.stockData = data;
        this.loadingStock = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement stock:', error);
        this.stockData = null;
        this.loadingStock = false;
      }
    });
  }

  // PRIX CALCULÉ - DEBUGGING
  calculatedPrice = computed(() => {
    console.log('💰 === CALCUL DU PRIX ===');
    let total = 0;
    const zones = this.zonesArray.value;
    
    console.log('💰 Zones array value:', zones);
    console.log('💰 Zones tarifaires disponibles:', this.zonesTarifaires());
    
    zones.forEach((zone: any) => {
      console.log('💰 Traitement zone:', zone);
      
      const zoneInfo = this.zonesTarifaires().find(z => z.id === zone.zone_tarifaire_id);
      console.log('💰 Zone info trouvée:', zoneInfo);
      
      if (!zoneInfo) {
        console.warn('⚠️ Zone info introuvable pour ID:', zone.zone_tarifaire_id);
        return;
      }
      
      if (zone.mode_paiement === 'table') {
        const totalTables = 
          (zone.nb_tables_standard || 0) + 
          (zone.nb_tables_grande || 0) + 
          (zone.nb_tables_mairie || 0);
        
        const pricePerTable = zoneInfo.price_per_table;
        const zonePrice = totalTables * pricePerTable;
        
        console.log(`💰 Mode TABLE: ${totalTables} tables × ${pricePerTable}€ = ${zonePrice}€`);
        total += zonePrice;
      } else {
        const surface = zone.surface_m2 || 0;
        const pricePerM2 = zoneInfo.m2_price;
        const zonePrice = surface * pricePerM2;
        
        console.log(`💰 Mode M²: ${surface} m² × ${pricePerM2}€ = ${zonePrice}€`);
        total += zonePrice;
      }
    });
    
    console.log('💰 PRIX TOTAL:', total);
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
      },
      error: (error) => {
        console.error('❌ Erreur chargement réservants:', error);
        this.loadingReservants = false;
      }
    });
  }

  loadZonesTarifaires(): void {
    const festivalId = this.festivalId();
    if (!festivalId) {
      console.error('❌ Pas de festival ID pour charger les zones');
      return;
    }
    
    this.loadingZones = true;
    console.log('🎯 Chargement zones tarifaires pour festival:', festivalId);
    
    this.reservationService.getZonesTarifaires(festivalId).subscribe({
      next: (zones: ZoneTarifaireDto[]) => {
        console.log('✅ Zones tarifaires reçues:', zones);
        console.log('✅ Détail première zone:', zones[0]);
        this.zonesTarifaires.set(zones);
        this.loadingZones = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur chargement zones:', error);
        this.loadingZones = false;
      }
    });
  }

  onModeChange(): void {
    const mode = this.reservationForm.get('reservant_mode')?.value;
    this.useExistingReservant = mode === 'existing';
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

  // VALIDATION DU STOCK AVANT AJOUT
  addZone(): void {
    console.log('🎯 === AJOUT ZONE ===');
    
    const zoneId = this.reservationForm.get('selected_zone_id')?.value;
    if (!zoneId) {
      console.warn('⚠️ Pas de zone sélectionnée');
      return;
    }
    
    console.log('🎯 Zone ID sélectionnée:', zoneId);
    
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
    
    console.log('🎯 Type de réservation:', reservationType);
    console.log('🎯 Tables demandées - Standard:', tempTablesStandard, 'Grande:', tempTablesGrande, 'Mairie:', tempTablesMairie);
    
    if (reservationType === 'table') {
      const totalRequestedTables = tempTablesStandard + tempTablesGrande + tempTablesMairie;
      
      console.log('🎯 Total tables demandées:', totalRequestedTables);
      
      if (totalRequestedTables === 0) {
        alert('Veuillez spécifier au moins une table');
        return;
      }
      
      // VÉRIFICATION DU STOCK
      const availableTables = this.getAvailableTables();
      console.log('🎯 Tables disponibles:', availableTables);
      
      if (!this.stockData) {
        console.error('❌ PROBLÈME: Pas de données de stock !');
        alert('⚠️ Impossible de vérifier le stock. Veuillez rafraîchir la page.');
        return;
      }
      
      if (totalRequestedTables > availableTables) {
        console.error('❌ STOCK INSUFFISANT !');
        alert(`❌ Stock insuffisant !\n\n` +
              `Vous demandez : ${totalRequestedTables} tables\n` +
              `Disponibles : ${availableTables} tables\n\n` +
              `Veuillez réduire le nombre de tables.`);
        return;
      }
      
      console.log('✅ Stock suffisant, ajout de la zone...');
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
    console.log('✅ Zone ajoutée au formulaire');
    console.log('📝 Zones actuelles:', this.zonesArray.value);
    
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
    console.log('🗑️ Zone supprimée, zones restantes:', this.zonesArray.value);
  }

  getZoneName(zoneId: number): string {
    const zone = this.zonesTarifaires().find(z => z.id === zoneId);
    return zone ? zone.name : 'Zone inconnue';
  }

  calculateZonePrice(zoneData: any): number {
    const zone = this.zonesTarifaires().find(z => z.id === zoneData.zone_tarifaire_id);
    if (!zone) {
      console.warn('⚠️ Zone non trouvée pour calcul prix:', zoneData.zone_tarifaire_id);
      return 0;
    }
    
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
          console.error('Réservant sélectionné introuvable');
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