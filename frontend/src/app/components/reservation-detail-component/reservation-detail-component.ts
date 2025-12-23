import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService, ZoneStock, ReservationWithZones } from '@app/services/reservation.service';

interface ZoneSelection {
  zone_tarifaire_id: number;
  name: string;
  price_per_table: number;
  price_per_m2: number;
  available_tables: number;
  total_tables: number;
  nb_tables_reservees: number;
  inputMode: 'tables' | 'm2'; // Mode de saisie
  m2_value: number; // Valeur en m² saisie
}

@Component({
  selector: 'app-reservation-detail-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-detail-component.html',
  styleUrl: './reservation-detail-component.scss'
})
export class ReservationDetailComponent {
  reservationId = input<number | null>(null);

  private readonly reservationService = inject(ReservationService);

  // Données de la réservation
  reservation = signal<ReservationWithZones | null>(null);
  
  // Zones tarifaires avec sélection
  zones = signal<ZoneSelection[]>([]);
  
  // Nombre de prises
  nbPrises = signal<number>(0);
  
  // Remises
  tableDiscountOffered = signal<number>(0); // Nombre de tables offertes
  directDiscount = signal<number>(0); // Remise directe en euros
  note = signal<string>('');
  
  // Messages
  message = signal<string | null>(null);
  isError = signal<boolean>(false);
  
  // État de chargement
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  // Prix par prise (constant pour le moment)
  readonly prixParPrise = 5;
  
  // Constante de conversion m² par table
  readonly M2_PER_TABLE = 4.5;

  // Prix de base (avant remises)
  startPrice = computed(() => {
    const zonesTotal = this.zones().reduce((sum, zone) => {
      return sum + (zone.nb_tables_reservees * zone.price_per_table);
    }, 0);
    const prisesTotal = this.nbPrises() * this.prixParPrise;
    return zonesTotal + prisesTotal;
  });

  // Montant de la remise en tables offertes (utilise le prix moyen par table)
  tableDiscountAmount = computed(() => {
    const zones = this.zones();
    if (zones.length === 0) return 0;
    // Calculer le prix moyen par table
    const totalTables = this.totalTables();
    if (totalTables === 0) return 0;
    const zonesTotal = zones.reduce((sum, zone) => {
      return sum + (zone.nb_tables_reservees * zone.price_per_table);
    }, 0);
    const avgPricePerTable = zonesTotal / totalTables;
    return this.tableDiscountOffered() * avgPricePerTable;
  });

  // Prix final après remises
  finalPrice = computed(() => {
    return Math.max(0, this.startPrice() - this.tableDiscountAmount() - this.directDiscount());
  });

  // Alias pour compatibilité
  totalPrice = this.finalPrice;

  // Nombre total de tables réservées
  totalTables = computed(() => {
    return this.zones().reduce((sum, zone) => sum + zone.nb_tables_reservees, 0);
  });

  // Nombre total de m² réservés
  totalM2 = computed(() => {
    return this.zones().reduce((sum, zone) => sum + (zone.nb_tables_reservees * this.M2_PER_TABLE), 0);
  });

  // Convertir m² en tables (arrondi supérieur)
  m2ToTables(m2: number): number {
    return Math.ceil(m2 / this.M2_PER_TABLE);
  }

  // Convertir tables en m²
  tablesToM2(tables: number): number {
    return tables * this.M2_PER_TABLE;
  }

  constructor() {
    effect(() => {
      const id = this.reservationId();
      if (id) {
        this.loadReservation(id);
      }
    });
  }

  loadReservation(reservationId: number) {
    this.loading.set(true);
    
    // Charger la réservation existante
    this.reservationService.getReservationById(reservationId).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.nbPrises.set(reservation.nb_prises || 0);
        this.tableDiscountOffered.set(reservation.table_discount_offered || 0);
        this.directDiscount.set(reservation.direct_discount || 0);
        this.note.set(reservation.note || '');
        
        // Charger le stock disponible pour le festival
        this.reservationService.getStockByFestival(reservation.festival_id).subscribe({
          next: (stock) => {
            // Fusionner le stock avec les réservations existantes
            const zonesWithSelection: ZoneSelection[] = stock.map(s => {
              const existingZone = reservation.zones_tarifaires.find(
                z => z.zone_tarifaire_id === s.id
              );
              const nbTables = existingZone?.nb_tables_reservees || 0;
              return {
                zone_tarifaire_id: s.id,
                name: s.name,
                price_per_table: s.price_per_table,
                price_per_m2: s.price_per_table / this.M2_PER_TABLE,
                available_tables: s.available_tables + nbTables,
                total_tables: s.total_tables,
                nb_tables_reservees: nbTables,
                inputMode: 'tables' as const,
                m2_value: nbTables * this.M2_PER_TABLE
              };
            });
            this.zones.set(zonesWithSelection);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Erreur lors du chargement du stock:', err);
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la réservation:', err);
        this.loading.set(false);
      }
    });
  }

  onTablesChange(zoneId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseInt(input.value, 10) || 0);
    
    this.zones.update(zones => 
      zones.map(z => {
        if (z.zone_tarifaire_id === zoneId) {
          // Limiter au max disponible
          const maxTables = z.available_tables;
          const nbTables = Math.min(value, maxTables);
          return { 
            ...z, 
            nb_tables_reservees: nbTables,
            m2_value: this.tablesToM2(nbTables)
          };
        }
        return z;
      })
    );
  }

  onM2Change(zoneId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const m2Value = Math.max(0, parseFloat(input.value) || 0);
    
    this.zones.update(zones => 
      zones.map(z => {
        if (z.zone_tarifaire_id === zoneId) {
          // Convertir m² en tables (arrondi supérieur)
          const tablesNeeded = this.m2ToTables(m2Value);
          const maxTables = z.available_tables;
          const nbTables = Math.min(tablesNeeded, maxTables);
          // Recalculer les m² effectifs
          const effectiveM2 = this.tablesToM2(nbTables);
          return { 
            ...z, 
            nb_tables_reservees: nbTables,
            m2_value: effectiveM2
          };
        }
        return z;
      })
    );
  }

  toggleInputMode(zoneId: number) {
    this.zones.update(zones => 
      zones.map(z => {
        if (z.zone_tarifaire_id === zoneId) {
          return { 
            ...z, 
            inputMode: z.inputMode === 'tables' ? 'm2' : 'tables'
          };
        }
        return z;
      })
    );
  }

  onPrisesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseInt(input.value, 10) || 0);
    this.nbPrises.set(value);
  }

  onTableDiscountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseInt(input.value, 10) || 0);
    // Limiter au nombre de tables réservées
    this.tableDiscountOffered.set(Math.min(value, this.totalTables()));
  }

  onDirectDiscountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseFloat(input.value) || 0);
    // Limiter au prix de base moins la remise tables
    const maxDiscount = this.startPrice() - this.tableDiscountAmount();
    this.directDiscount.set(Math.min(value, maxDiscount));
  }

  onNoteChange(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.note.set(input.value);
  }

  saveReservation() {
    const reservation = this.reservation();
    if (!reservation) return;

    this.saving.set(true);
    this.message.set(null);

    const zonesData = this.zones()
      .filter(z => z.nb_tables_reservees > 0)
      .map(z => ({
        zone_tarifaire_id: z.zone_tarifaire_id,
        nb_tables_reservees: z.nb_tables_reservees
      }));

    this.reservationService.updateReservation(reservation.id, {
      start_price: this.startPrice(),
      nb_prises: this.nbPrises(),
      final_price: this.finalPrice(),
      table_discount_offered: this.tableDiscountOffered(),
      direct_discount: this.directDiscount(),
      note: this.note(),
      zones_tarifaires: zonesData
    }).subscribe({
      next: () => {
        this.message.set('Réservation mise à jour avec succès !');
        this.isError.set(false);
        this.saving.set(false);
        setTimeout(() => this.message.set(null), 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        this.message.set('Erreur lors de la mise à jour de la réservation.');
        this.isError.set(true);
        this.saving.set(false);
        setTimeout(() => this.message.set(null), 3000);
      }
    });
  }
}
