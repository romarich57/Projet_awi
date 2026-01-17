import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ZonePlanAllocationSummary, ZonePlanService, AllocatedGameWithReservant, ZonePlanReservationAllocation, ZonePlanSimpleAllocation } from '@app/services/zone-plan-service';
import { ZoneTarifaireService } from '@app/services/zone-tarifaire.service';
import { ReservationService } from '@app/services/reservation.service';
import { ZonePlanForm } from '../zone-plan-form/zone-plan-form';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { ZonePlanDto } from '@app/types/zone-plan-dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TableStockByType } from '@app/types/allocated-game-dto';
import type { ReservationWithZones } from '@app/services/reservation.service';
import { M2_PER_TABLE, m2ToTables, tablesToM2 } from '@app/shared/utils/table-conversion';

// Interface pour une zone avec ses jeux alloués
interface ZonePlanAvecJeux extends ZonePlanDto {
  jeuxAlloues: AllocatedGameWithReservant[];
  simpleAllocations: ZonePlanSimpleAllocation[];
  expanded: boolean;
}

@Component({
  selector: 'app-zone-plan-jeux',
  imports: [ZonePlanForm, CommonModule, FormsModule],
  templateUrl: './zone-plan-jeux.html',
  styleUrl: './zone-plan-jeux.scss'
})
export class ZonePlanJeux {

  festivalId = input.required<number | null>();
  reservation = input<ReservationWithZones | null>(null);
  refreshToken = input<number>(0);
  hasGames = input<boolean>(true);
  private readonly _zonePlanService = inject(ZonePlanService);
  private readonly _zoneTarifaireService = inject(ZoneTarifaireService);
  private readonly _reservationService = inject(ReservationService);
  
  readonly zonePlans = this._zonePlanService.zonePlans;
  readonly zoneTarifaires = signal<ZoneTarifaireDto[]>([]);
  readonly showForm = signal(false);
  readonly zonePlanToEdit = signal<ZonePlanDto | null>(null);
  
  // Nouvelles propriétés pour l'allocation des jeux
  readonly zonesAvecJeux = signal<ZonePlanAvecJeux[]>([]);
  readonly jeuxNonAlloues = signal<AllocatedGameWithReservant[]>([]);
  readonly showAllocationModal = signal(false);
  readonly selectedZone = signal<ZonePlanAvecJeux | null>(null);
  readonly selectedGame = signal<AllocatedGameWithReservant | null>(null);
  readonly nbExemplairesInput = signal<number>(1);
  readonly tailleTableInput = signal<'aucun' | 'standard' | 'grande' | 'mairie'>('standard');
  readonly chaisesInput = signal<number>(0);
  readonly gameInputMode = signal<'tables' | 'm2'>('tables');
  readonly gameTablesInput = signal<number>(1);
  readonly gameM2Input = signal<number>(tablesToM2(1));
  readonly simpleInputMode = signal<'tables' | 'm2'>('tables');
  readonly simpleTablesInput = signal<number>(0);
  readonly simpleM2Input = signal<number>(0);
  readonly simpleChaisesInput = signal<number>(0);
  readonly loading = signal(false);
  readonly allocationsSimple = signal<ZonePlanAllocationSummary[]>([]);
  readonly reservationAllocations = signal<ZonePlanReservationAllocation[]>([]);
  
  // Stock de tables par type pour la zone sélectionnée
  readonly stockTables = signal<TableStockByType[]>([]);
  
  // Stock de chaises pour le festival (total et disponible)
  readonly chaisesStock = signal<{ total: number; available: number }>({ total: 0, available: 0 });

  readonly tablesToM2 = tablesToM2;

  readonly isGameMode = computed(() => {
    if (!this.hasGames()) return false;
    const reservation = this.reservation();
    if (!reservation) return false;
    if (this.jeuxNonAlloues().length > 0) return true;
    return this.zonesAvecJeux().some(zone =>
      zone.jeuxAlloues.some(jeu => jeu.reservation_id === reservation.id)
    );
  });

  readonly tablesSimplesParZone = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.allocationsSimple()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_tables) || 0;
    }
    return result;
  });

  readonly chaisesAlloueesParZone = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.allocationsSimple()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_chaises) || 0;
    }
    return result;
  });

  readonly chaisesDisponibles = computed(() => {
    return this.chaisesStock().available;
  });

  readonly tablesReserveesParZoneTarifaire = computed(() => {
    const reservation = this.reservation();
    const result: Record<number, number> = {};
    if (!reservation) return result;

    for (const zone of reservation.zones_tarifaires) {
      result[zone.zone_tarifaire_id] = Number(zone.nb_tables_reservees) || 0;
    }
    return result;
  });

  readonly reservationAllocationsParZone = computed(() => {
    const result: Record<number, ZonePlanReservationAllocation> = {};
    for (const allocation of this.reservationAllocations()) {
      result[allocation.zone_plan_id] = allocation;
    }
    return result;
  });

  readonly tablesAlloueesParZoneReservation = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.reservationAllocations()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_tables) || 0;
    }
    return result;
  });

  readonly chaisesAlloueesParZoneReservation = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.reservationAllocations()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_chaises) || 0;
    }
    return result;
  });

  readonly tablesAlloueesParZoneTarifaireReservation = computed(() => {
    const result: Record<number, number> = {};
    const zonePlans = this.zonePlans();
    const allocations = this.tablesAlloueesParZoneReservation();

    for (const zone of zonePlans) {
      const tables = allocations[zone.id] || 0;
      result[zone.id_zone_tarifaire] = (result[zone.id_zone_tarifaire] || 0) + tables;
    }

    return result;
  });

  // Tables occupées pour l'allocation du jeu
  readonly tablesCalculees = computed(() => {
    return this.gameTablesInput();
  });

  // Filtrer les jeux disponibles pour la zone sélectionnée
  // Un jeu n'est disponible que si son réservant a réservé des tables dans la zone tarifaire de la zone de plan
  readonly jeuxDisponiblesPourZone = computed(() => {
    const zone = this.selectedZone();
    const jeux = this.jeuxNonAlloues();
    
    if (!zone) return [];
    
    // Filtrer les jeux dont le réservant a réservé dans cette zone tarifaire
    return jeux.filter(jeu => {
      // Si zones_tarifaires_reservees est défini, vérifier que la zone tarifaire de la zone de plan est incluse
      if (jeu.zones_tarifaires_reservees && jeu.zones_tarifaires_reservees.length > 0) {
        return jeu.zones_tarifaires_reservees.includes(zone.id_zone_tarifaire);
      }
      // Si pas d'info sur les zones tarifaires réservées, on ne peut pas allouer
      return false;
    });
  });

  // Stock restant pour la taille de table sélectionnée
  readonly stockPourTailleSelectionnee = computed(() => {
    const taille = this.tailleTableInput();
    // Si 'aucun' est sélectionné, pas besoin de vérifier le stock de tables
    if (taille === 'aucun') return Infinity; // infini c'est pour dire qu'il n'y a pas de limite ca veut dire que on peut toujours allouer
    const stock = this.stockTables();
    const stockItem = stock.find(s => s.table_type === taille); // on cherche l'élément correspondant à la taille sélectionnée
    return stockItem ? stockItem.restantes : Infinity; // on retourne infini si pas trouvé pour ne pas bloquer l'allocation
    // stockItem ? stockItem.restantes signifie que si on trouve stockItem on retourne stockItem.restantes sinon on retourne Infinity
  });

  // Vérifie si le stock est suffisant pour l'allocation
  readonly stockInsuffisant = computed(() => {
    const taille = this.tailleTableInput();
    // Si 'aucun' est sélectionné, le stock de tables n'est pas vérifié
    if (taille === 'aucun') return false;
    return this.stockPourTailleSelectionnee() < this.tablesCalculees();
  });

  // Calcule le nombre de tables utilisées dans les zones de plan par zone tarifaire
  readonly tablesUtiliseesParZoneTarifaire = computed(() => {
    const zonePlans = this.zonePlans();
    const result: Record<number, number> = {}; //record c'est un objet avec des clés de type number et des valeurs de type number
    
    for (const zp of zonePlans) { //pour chaque zone de plan, on récupère son id de zone tarifaire
      const ztId = zp.id_zone_tarifaire;
      result[ztId] = (result[ztId] || 0) + zp.nb_tables;
    }
    
    return result;
  });

  // Calcule le nombre de tables restantes disponibles par zone tarifaire
  readonly tablesRestantesParZoneTarifaire = computed(() => {
    const zoneTarifaires = this.zoneTarifaires();
    const utilisees = this.tablesUtiliseesParZoneTarifaire();
    const result: Record<number, number> = {};
    
    for (const zt of zoneTarifaires) {
      const used = utilisees[zt.id] || 0;
      result[zt.id] = zt.nb_tables - used;
    }
    
    return result;
  });

  constructor() { 
    effect(() => {
      const id = this.festivalId();
      if (id !== null) {
        this._zonePlanService.getZonePlans(id);
        this.loadZoneTarifaires(id);
        this.loadStockTablesFestival(id);
        this.loadAllocationsSimple(id);
        this.loadChaisesStock(id);
      }
    });

    effect(() => {
      const festivalId = this.festivalId();
      const reservation = this.reservation();
      if (festivalId === null || !reservation) return;
      this.loadJeuxNonAlloues(festivalId, reservation.id);
      this.loadReservationAllocations(reservation.id);
    });

    // Effet pour charger les jeux de chaque zone quand zonePlans change
    effect(() => {
      const zones = this.zonePlans();
      if (zones.length > 0) {
        this.loadZonesAvecJeux(zones);
      }
    });

    effect(() => {
      const token = this.refreshToken();
      const festivalId = this.festivalId();
      if (festivalId === null) return;
      this._zonePlanService.getZonePlans(festivalId);
      this.loadZoneTarifaires(festivalId);
      this.loadJeuxNonAllouesForRefresh(festivalId);
      this.loadStockTablesFestival(festivalId);
      this.loadAllocationsSimple(festivalId);
      this.loadChaisesStock(festivalId);
    });
  }

  private loadZoneTarifaires(festivalId: number): void {
    // Charger uniquement les zones tarifaires qui ont des réservations
    this._zoneTarifaireService.getZonesTarifairesWithReservations(festivalId).subscribe({
      next: (zones) => this.zoneTarifaires.set(zones),
      error: (err) => console.error('Erreur chargement zones tarifaires', err)
    });
  }

  private loadJeuxNonAlloues(festivalId: number, reservationId: number): void {
    this._zonePlanService.getJeuxNonAlloues(festivalId, reservationId).subscribe({
      next: (jeux) => this.jeuxNonAlloues.set(jeux),
      error: (err) => console.error('Erreur chargement jeux non alloués', err)
    });
  }

  private loadJeuxNonAllouesForRefresh(festivalId: number): void {
    const reservation = this.reservation();
    if (!reservation) return;
    this.loadJeuxNonAlloues(festivalId, reservation.id);
  }

  private loadStockTablesFestival(festivalId: number): void {
    this._zonePlanService.getStockTablesFestival(festivalId).subscribe({
      next: (data) => this.stockTables.set(data.stock),
      error: (err) => console.error('Erreur chargement stock tables festival', err)
    });
  }

  private loadAllocationsSimple(festivalId: number): void {
    this._zonePlanService.getFestivalAllocationsSummary(festivalId).subscribe({
      next: (allocations) => this.allocationsSimple.set(allocations),
      error: (err) => console.error('Erreur chargement allocations simples', err)
    });
  }

  private loadReservationAllocations(reservationId: number): void {
    this._zonePlanService.getReservationAllocations(reservationId).subscribe({
      next: (allocations) => this.reservationAllocations.set(allocations),
      error: (err) => console.error('Erreur chargement allocations réservation', err)
    });
  }

  private loadChaisesStock(festivalId: number): void {
    this._reservationService.getStockByFestival(festivalId).subscribe({
      next: (stock) => {
        if (stock.chaises) {
          this.chaisesStock.set({
            total: stock.chaises.total,
            available: stock.chaises.available
          });
        }
      },
      error: (err) => console.error('Erreur chargement stock chaises', err)
    });
  }

  private loadZonesAvecJeux(zones: ZonePlanDto[]): void {
    const zonesAvec: ZonePlanAvecJeux[] = zones.map(z => ({
      ...z,
      jeuxAlloues: [],
      simpleAllocations: [],
      expanded: false
    }));
    this.zonesAvecJeux.set(zonesAvec);

    // Charger les jeux pour chaque zone
    for (const zone of zonesAvec) {
      this._zonePlanService.getJeuxAlloues(zone.id).subscribe({
        next: (jeux) => {
          this.zonesAvecJeux.update(current => 
            current.map(z => z.id === zone.id ? { ...z, jeuxAlloues: jeux } : z)
          );
        },
        error: (err) => console.error(`Erreur chargement jeux zone ${zone.id}`, err)
      });

      this._zonePlanService.getZoneSimpleAllocations(zone.id).subscribe({
        next: (allocations) => {
          this.zonesAvecJeux.update(current =>
            current.map(z => z.id === zone.id ? { ...z, simpleAllocations: allocations } : z)
          );
        },
        error: (err) => console.error(`Erreur chargement allocations simples zone ${zone.id}`, err)
      });
    }
  }

  // Calcule le nombre de tables utilisées (jeux alloués) par zone
  readonly tablesUtiliseesParZone = computed(() => {
    const zones = this.zonesAvecJeux();
    const simples = this.tablesSimplesParZone();
    const result: Record<number, number> = {};
    
    for (const zone of zones) {
      const tablesJeux = zone.jeuxAlloues.reduce((sum, jeu) => sum + Number(jeu.nb_tables_occupees), 0);
      result[zone.id] = tablesJeux + (simples[zone.id] || 0);
    }
    
    return result;
  });

  // Calcule le nombre de tables restantes par zone
  readonly tablesRestantesParZone = computed(() => {
    const zones = this.zonesAvecJeux();
    const utilisees = this.tablesUtiliseesParZone();
    const result: Record<number, number> = {};
    
    for (const zone of zones) {
      result[zone.id] = zone.nb_tables - (utilisees[zone.id] || 0);
    }
    
    return result;
  });

  isZoneEligible(zone: ZonePlanDto): boolean {
    return (this.tablesReserveesParZoneTarifaire()[zone.id_zone_tarifaire] || 0) > 0;
  }

  tablesDisponiblesPourZone(zone: ZonePlanDto): number {
    const reservees = this.tablesReserveesParZoneTarifaire()[zone.id_zone_tarifaire] || 0;
    const alloueesDansZoneTarifaire = this.tablesAlloueesParZoneTarifaireReservation()[zone.id_zone_tarifaire] || 0;
    const current = this.tablesAlloueesParZoneReservation()[zone.id] || 0;
    const totalAlloueesZone = this.tablesUtiliseesParZone()[zone.id] || 0;
    const maxParReservation = reservees - alloueesDansZoneTarifaire + current;
    const maxParZone = zone.nb_tables - totalAlloueesZone + current;
    return Math.max(0, Math.min(maxParReservation, maxParZone));
  }

  toggleZoneExpansion(zoneId: number): void {
    this.zonesAvecJeux.update(zones =>
      zones.map(z => z.id === zoneId ? { ...z, expanded: !z.expanded } : z)
    );
  }

  // Ouvrir le modal d'allocation pour une zone
  openAllocationModal(zone: ZonePlanAvecJeux): void {
    if (!this.isGameMode()) {
      if (!this.isZoneEligible(zone)) return;
      this.openSimpleAllocationModal(zone);
      return;
    }
    this.selectedZone.set(zone);
    this.selectedGame.set(null);
    this.nbExemplairesInput.set(1);
    this.tailleTableInput.set('standard');
    // Initialiser avec les chaises déjà allouées pour cette zone
    this.chaisesInput.set(0);
    this.gameInputMode.set('tables');
    this.gameTablesInput.set(1);
    this.gameM2Input.set(tablesToM2(1));
    this.showAllocationModal.set(true);
    // Le stock est déjà chargé au niveau du festival
  }

  closeAllocationModal(): void {
    this.showAllocationModal.set(false);
    this.selectedZone.set(null);
    this.selectedGame.set(null);
  }

  private openSimpleAllocationModal(zone: ZonePlanAvecJeux): void {
    this.selectedZone.set(zone);
    this.selectedGame.set(null);
    this.simpleInputMode.set('tables');
    const currentTables = this.tablesAlloueesParZoneReservation()[zone.id] || 0;
    const currentChaises = this.chaisesAlloueesParZoneReservation()[zone.id] || 0;
    const availableTables = this.tablesDisponiblesPourZone(zone);
    const initialTables = currentTables || (availableTables > 0 ? 1 : 0);
    this.simpleTablesInput.set(initialTables);
    this.simpleM2Input.set(tablesToM2(initialTables));
    this.simpleChaisesInput.set(currentChaises);
    this.showAllocationModal.set(true);
  }

  setSimpleInputMode(mode: 'tables' | 'm2'): void {
    this.simpleInputMode.set(mode);
  }

  onSimpleTablesInputChange(value: number): void {
    const tables = Math.max(0, Math.floor(value || 0));
    this.simpleTablesInput.set(tables);
    this.simpleM2Input.set(tablesToM2(tables));
  }

  onSimpleM2InputChange(value: number): void {
    const m2Value = Math.max(0, Number(value) || 0);
    const tables = m2ToTables(m2Value);
    this.simpleM2Input.set(m2Value);
    this.simpleTablesInput.set(tables);
  }

  onSimpleChaisesInputChange(value: number): void {
    const chaises = Math.max(0, Math.floor(value || 0));
    const zone = this.selectedZone();
    const currentChaises = zone ? (this.chaisesAlloueesParZoneReservation()[zone.id] || 0) : 0;
    const maxChaises = this.chaisesStock().available + currentChaises;
    this.simpleChaisesInput.set(Math.min(chaises, maxChaises));
  }

  simpleChaisesDisponibles(): number {
    const zone = this.selectedZone();
    const currentChaises = zone ? (this.chaisesAlloueesParZoneReservation()[zone.id] || 0) : 0;
    return this.chaisesStock().available + currentChaises;
  }

  private gameM2ToTables(m2Value: number): number {
    const tables = m2Value / M2_PER_TABLE;
    return Math.round(tables * 2) / 2;
  }

  setGameInputMode(mode: 'tables' | 'm2'): void {
    this.gameInputMode.set(mode);
  }

  onGameTablesInputChange(value: number): void {
    const tables = Math.max(0, Number(value) || 0);
    this.gameTablesInput.set(tables);
    this.gameM2Input.set(tablesToM2(tables));
  }

  onGameM2InputChange(value: number): void {
    const m2Value = Math.max(0, Number(value) || 0);
    const tables = this.gameM2ToTables(m2Value);
    this.gameM2Input.set(m2Value);
    this.gameTablesInput.set(tables);
  }

  onNbExemplairesChange(value: number): void {
    const nbExemplaires = Math.max(1, Math.floor(value || 1));
    this.nbExemplairesInput.set(nbExemplaires);
  }

  chaisesPourReservation(zone: ZonePlanAvecJeux, reservationId: number): number {
    const allocation = zone.simpleAllocations.find(a => a.reservation_id === reservationId);
    return allocation ? (Number(allocation.nb_chaises) || 0) : 0;
  }

  onChaisesInputChange(value: number): void {
    const chaises = Math.max(0, Math.floor(value || 0));
    // Limiter au stock disponible
    const maxChaises = this.chaisesDisponibles();
    this.chaisesInput.set(Math.min(chaises, maxChaises));
  }

  selectGameForAllocation(game: AllocatedGameWithReservant): void {
    this.selectedGame.set(game);
    // Pré-remplir avec les valeurs existantes du jeu ou des valeurs par défaut
    // nb_tables_occupees contient le total, on suppose 1 place par exemplaire par défaut
    const nbExemplaires = Number(game.nb_exemplaires) || 1;
    const nbTables = Number(game.nb_tables_occupees) || 1;
    this.nbExemplairesInput.set(nbExemplaires);
    this.gameTablesInput.set(nbTables);
    this.gameM2Input.set(tablesToM2(nbTables));
    this.tailleTableInput.set(game.taille_table_requise || 'standard');
    
    this.chaisesInput.set(0);
  }

  // Allouer le jeu sélectionné à la zone
  allocateGame(): void {
    const zone = this.selectedZone();
    const game = this.selectedGame();
    const nbTables = this.tablesCalculees();
    const nbExemplaires = this.nbExemplairesInput();
    const tailleTable = this.tailleTableInput();
    const nbChaises = this.chaisesInput();
    
    if (!zone || !game) return;
    
    // Vérifier que les tables ne dépassent pas la capacité
    const tablesRestantes = this.tablesRestantesParZone()[zone.id] || 0;
    if (nbTables > tablesRestantes) {
      alert(`Pas assez de tables disponibles. Restantes: ${tablesRestantes}, Demandées: ${nbTables}`);
      return;
    }

    // Vérifier que les chaises ne dépassent pas le stock disponible
    const chaisesDisponibles = this.chaisesDisponibles();
    if (nbChaises > chaisesDisponibles) {
      alert(`Pas assez de chaises disponibles. Disponibles: ${chaisesDisponibles}, Demandées: ${nbChaises}`);
      return;
    }
    
    this.loading.set(true);
    this._zonePlanService.assignerJeuAZone(game.allocation_id, zone.id, nbTables, nbExemplaires, tailleTable).subscribe({
      next: () => {
        // Si des chaises sont allouées, mettre à jour l'allocation des chaises pour cette réservation
        if (nbChaises > 0 || this.chaisesAlloueesParZone()[zone.id] > 0) {
          // Récupérer les tables simples déjà allouées pour cette zone par cette réservation (s'il y en a)
          const tablesSimples = this.tablesAlloueesParZoneReservation()[zone.id] || 0;
          this._zonePlanService.setReservationAllocation(game.reservation_id, zone.id, tablesSimples, nbChaises).subscribe({
            next: () => {
              this.refreshData();
              this.closeAllocationModal();
            },
            error: (err) => {
              console.error('Erreur lors de l\'allocation des chaises', err);
              this.refreshData();
              this.closeAllocationModal();
            }
          });
        } else {
          this.refreshData();
          this.closeAllocationModal();
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'allocation', err);
        this.loading.set(false);
      }
    });
  }

  saveSimpleAllocation(): void {
    const zone = this.selectedZone();
    const reservation = this.reservation();
    if (!zone || !reservation) return;

    const nbTables = Math.max(0, Math.floor(this.simpleTablesInput()));
    const nbChaises = Math.max(0, Math.floor(this.simpleChaisesInput()));
    const maxTables = this.tablesDisponiblesPourZone(zone);

    if (nbTables <= 0 && nbChaises <= 0) return;

    if (nbTables > maxTables) {
      alert(`Pas assez de tables disponibles. Max: ${maxTables}, Demandées: ${nbTables}`);
      return;
    }

    this.loading.set(true);
    this._zonePlanService.setReservationAllocation(reservation.id, zone.id, nbTables, nbChaises).subscribe({
      next: () => {
        this.refreshData();
        this.closeAllocationModal();
      },
      error: (err) => {
        console.error('Erreur lors de l\'allocation simple', err);
        this.loading.set(false);
      }
    });
  }

  removeSimpleAllocation(zoneId: number): void {
    const reservation = this.reservation();
    if (!reservation) return;
    const allocation = this.reservationAllocationsParZone()[zoneId];
    if (!allocation) return;

    this.loading.set(true);
    this._zonePlanService.deleteReservationAllocation(reservation.id, zoneId).subscribe({
      next: () => {
        this.refreshData();
      },
      error: (err) => {
        console.error('Erreur lors du retrait', err);
        this.loading.set(false);
      }
    });
  }

  // Retirer un jeu d'une zone (le remettre dans les non alloués)
  removeGameFromZone(game: AllocatedGameWithReservant): void {
    this.loading.set(true);
    this._zonePlanService.assignerJeuAZone(game.allocation_id, null).subscribe({
      next: () => {
        this.afterGameRemoval(game);
      },
      error: (err) => {
        console.error('Erreur lors du retrait', err);
        this.loading.set(false);
      }
    });
  }

  // Modifier le nombre de tables pour un jeu
  updateNbTables(game: AllocatedGameWithReservant, nbTables: number): void {
    if (nbTables <= 0) return;
    
    this._zonePlanService.assignerJeuAZone(game.allocation_id, game.zone_plan_id, nbTables).subscribe({
      next: () => {
        this.refreshData();
      },
      error: (err) => console.error('Erreur lors de la mise à jour', err)
    });
  }

  private refreshData(): void {
    const id = this.festivalId();
    const reservation = this.reservation();
    if (id !== null) {
      this._zonePlanService.getZonePlans(id);
      if (reservation) {
        this.loadJeuxNonAlloues(id, reservation.id);
        this.loadReservationAllocations(reservation.id);
      }
      this.loadStockTablesFestival(id);
      this.loadAllocationsSimple(id);
      this.loadChaisesStock(id);
    }
    this.loading.set(false);
  }

  private afterGameRemoval(game: AllocatedGameWithReservant): void {
    const reservation = this.reservation();
    const zoneId = game.zone_plan_id;
    if (!reservation || !zoneId) {
      this.refreshData();
      return;
    }

    const zone = this.zonesAvecJeux().find(z => z.id === zoneId) || null;
    const remainingGamesForReservation = zone
      ? zone.jeuxAlloues.filter(j => j.reservation_id === reservation.id && j.allocation_id !== game.allocation_id).length
      : 0;

    if (remainingGamesForReservation > 0) {
      this.refreshData();
      return;
    }

    const allocation = this.reservationAllocations().find(a => a.zone_plan_id === zoneId);
    if (!allocation || (Number(allocation.nb_chaises) || 0) <= 0) {
      this.refreshData();
      return;
    }

    const nbTables = Number(allocation.nb_tables) || 0;
    if (nbTables > 0) {
      this._zonePlanService.setReservationAllocation(reservation.id, zoneId, nbTables, 0).subscribe({
        next: () => this.refreshData(),
        error: (err) => {
          console.error('Erreur lors de la mise à jour des chaises', err);
          this.refreshData();
        }
      });
      return;
    }

    this._zonePlanService.deleteReservationAllocation(reservation.id, zoneId).subscribe({
      next: () => this.refreshData(),
      error: (err) => {
        console.error('Erreur lors de la suppression des chaises', err);
        this.refreshData();
      }
    });
  }

  openForm(): void {
    this.zonePlanToEdit.set(null);
    this.showForm.set(true);
  }

  openEditForm(zone: ZonePlanDto): void {
    this.zonePlanToEdit.set(zone);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.zonePlanToEdit.set(null);
    this.showForm.set(false);
  }

  onZonePlanCreated(): void {
    const id = this.festivalId();
    if (id !== null) {
      this._zonePlanService.getZonePlans(id);
    }
  }

  deleteZonePlan(zonePlanId: number): void {
    const id = this.festivalId();
    if (id !== null) {
      this._zonePlanService.deleteZonePlan(zonePlanId, id);
    }
  }

}
