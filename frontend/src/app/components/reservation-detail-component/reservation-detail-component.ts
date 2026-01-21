import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService, ReservationWithZones } from '@app/services/reservation.service';
import { M2_PER_TABLE, m2ToTables, tablesToM2 } from '@app/shared/utils/table-conversion';
import { AuthService } from '@app/services/auth.service';

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-detail-component.html',
  styleUrl: './reservation-detail-component.scss'
})
// Role : Afficher et editer les details d'une reservation.
// Préconditions : `reservationId` est fourni; ReservationService est disponible.
// Postconditions : Les donnees de reservation sont chargees et mises a jour.
export class ReservationDetailComponent {
  reservationId = input<number | null>(null);
  reservationLoaded = output<ReservationWithZones>();

  private readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);

  // Signal pour savoir si le formulaire est en lecture seule
  readonly readOnly = computed(() => {
    const user = this.authService.currentUser();
    return user?.role !== 'admin' && user?.role !== 'super-organizer';
  });

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

  // Prix par prise 
  prixParPrise = signal<number>(0);
  
  // Constante de conversion m² par table
  readonly M2_PER_TABLE = M2_PER_TABLE;
  readonly m2ToTables = m2ToTables;
  readonly tablesToM2 = tablesToM2;

  // Prix de base (avant remises)
  startPrice = computed(() => {
    const zonesTotal = this.zones().reduce((sum, zone) => {
      return sum + (zone.nb_tables_reservees * zone.price_per_table);
    }, 0);
    const prisesTotal = this.nbPrises() * this.prixParPrise();
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

  constructor() {
    effect(() => {
      const id = this.reservationId();
      if (id) {
        this.loadReservation(id);
      }
    });
  }

  // Role : Charger la reservation et initialiser les zones/valeurs associees.
  // Préconditions : `reservationId` est un identifiant valide.
  // Postconditions : Les signaux de reservation, zones et remises sont mis a jour.
  loadReservation(reservationId: number) {
    this.loading.set(true);
    
    // Charger la réservation existante
    this.reservationService.getReservationById(reservationId).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.reservationLoaded.emit(reservation);
        this.nbPrises.set(reservation.nb_prises || 0);
        this.tableDiscountOffered.set(reservation.table_discount_offered || 0);
        this.directDiscount.set(reservation.direct_discount || 0);
        this.note.set(reservation.note || '');

        this.reservationService.getFestival(reservation.festival_id).subscribe({
          next: (festival) => {
            this.prixParPrise.set(Number(festival.prix_prises) || 0);
          },
          error: (err) => console.error('Erreur chargement infos festival', err)
        });
        
        // Charger le stock disponible pour le festival
        this.reservationService.getStockByFestival(reservation.festival_id).subscribe({
          next: (stockResponse) => {
            // Fusionner le stock avec les réservations existantes
            const zonesWithSelection: ZoneSelection[] = stockResponse.zones.map(s => {
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

  // Role : Mettre a jour le nombre de tables reservees pour une zone.
  // Préconditions : `zoneId` reference une zone chargee.
  // Postconditions : La zone est mise a jour et les m2 sont recalcules.
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

  // Role : Mettre a jour la surface reservee (m2) pour une zone.
  // Préconditions : `zoneId` reference une zone chargee.
  // Postconditions : La zone est mise a jour et le nombre de tables est recalculé.
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

  // Role : Basculer le mode de saisie (tables/m2) pour une zone.
  // Préconditions : `zoneId` reference une zone chargee.
  // Postconditions : Le mode de saisie est inverse pour la zone cible.
  toggleInputMode(zoneId: number) {
    this.zones.update(zones =>  //update permet de modifier le signal zones
      zones.map(z => { //map permet de parcourir chaque zones
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

  // Role : Mettre a jour le nombre de prises.
  // Préconditions : L'evenement provient d'un champ numerique.
  // Postconditions : `nbPrises` est mis a jour.
  onPrisesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseInt(input.value, 10) || 0);
    this.nbPrises.set(value);
  }

  // Role : Mettre a jour la remise en tables offertes.
  // Préconditions : L'evenement provient d'un champ numerique.
  // Postconditions : `tableDiscountOffered` est mis a jour et borne.
  onTableDiscountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseInt(input.value, 10) || 0);
    // Limiter au nombre de tables réservées
    this.tableDiscountOffered.set(Math.min(value, this.totalTables()));
  }

  // Role : Mettre a jour la remise directe en euros.
  // Préconditions : L'evenement provient d'un champ numerique.
  // Postconditions : `directDiscount` est mis a jour et borne par le prix possible.
  onDirectDiscountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, parseFloat(input.value) || 0);
    // Limiter au prix de base moins la remise tables
    const maxDiscount = this.startPrice() - this.tableDiscountAmount();
    this.directDiscount.set(Math.min(value, maxDiscount));
  }

  // Role : Mettre a jour la note de reservation.
  // Préconditions : L'evenement provient d'un textarea.
  // Postconditions : `note` est mis a jour.
  onNoteChange(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.note.set(input.value);
  }

  // Role : Sauvegarder la reservation avec les zones et remises actuelles.
  // Préconditions : Une reservation est chargee.
  // Postconditions : Les donnees sont persistees et un message d'etat est affiche.
  saveReservation() {
    const reservation = this.reservation();
    if (!reservation) return;

    this.saving.set(true);
    this.message.set(null);

    const zonesData = this.zones()
      .filter(z => z.nb_tables_reservees > 0)
      .map(z => ({
        zone_tarifaire_id: z.zone_tarifaire_id,
        nb_tables_reservees: z.nb_tables_reservees,
        nb_chaises_reservees: 0
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
        const currentReservation = this.reservation();
        if (currentReservation) {
          const zonesTarifaires = this.zones()
            .filter(z => z.nb_tables_reservees > 0)
            .map(z => ({
              zone_tarifaire_id: z.zone_tarifaire_id,
              nb_tables_reservees: z.nb_tables_reservees,
              nb_chaises_reservees: 0,
              zone_name: z.name,
              price_per_table: z.price_per_table,
              nb_tables_available: z.available_tables
            }));
          const updatedReservation = {
            ...currentReservation,
            zones_tarifaires: zonesTarifaires
          };
          this.reservation.set(updatedReservation);
          this.reservationLoaded.emit(updatedReservation);
        }
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
