import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ZonePlanAllocationSummary, ZonePlanService, AllocatedGameWithReservant } from '@app/services/zone-plan-service';
import { ZoneTarifaireService } from '@app/services/zone-tarifaire.service';
import { ZonePlanForm } from '../zone-plan-form/zone-plan-form';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { ZonePlanDto } from '@app/types/zone-plan-dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TableStockByType } from '@app/types/allocated-game-dto';

// Interface pour une zone avec ses jeux alloués
interface ZonePlanAvecJeux extends ZonePlanDto {
  jeuxAlloues: AllocatedGameWithReservant[];
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
  private readonly _zonePlanService = inject(ZonePlanService);
  private readonly _zoneTarifaireService = inject(ZoneTarifaireService);
  
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
  readonly placeOccupeeInput = signal<number>(1);
  readonly nbExemplairesInput = signal<number>(1);
  readonly tailleTableInput = signal<'standard' | 'grande' | 'mairie'>('standard');
  readonly loading = signal(false);
  readonly allocationsSimple = signal<ZonePlanAllocationSummary[]>([]);
  
  // Stock de tables par type pour la zone sélectionnée
  readonly stockTables = signal<TableStockByType[]>([]);

  readonly tablesSimplesParZone = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.allocationsSimple()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_tables) || 0;
    }
    return result;
  });

  // Calcul automatique des tables occupées = place × exemplaires
  readonly tablesCalculees = computed(() => {
    const place = this.placeOccupeeInput();
    const exemplaires = this.nbExemplairesInput();
    return place * exemplaires;
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
    const stock = this.stockTables();
    const taille = this.tailleTableInput();
    const stockItem = stock.find(s => s.table_type === taille);
    return stockItem ? stockItem.restantes : Infinity;
  });

  // Vérifie si le stock est suffisant pour l'allocation
  readonly stockInsuffisant = computed(() => {
    return this.stockPourTailleSelectionnee() < this.tablesCalculees();
  });

  // Calcule le nombre de tables utilisées dans les zones de plan par zone tarifaire
  readonly tablesUtiliseesParZoneTarifaire = computed(() => {
    const zonePlans = this.zonePlans();
    const result: Record<number, number> = {}; //record c'est un objet avec des clés de type number et des valeurs de type number
    
    for (const zp of zonePlans) {
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
        this.loadJeuxNonAlloues(id);
        this.loadStockTablesFestival(id);
        this.loadAllocationsSimple(id);
      }
    });

    // Effet pour charger les jeux de chaque zone quand zonePlans change
    effect(() => {
      const zones = this.zonePlans();
      if (zones.length > 0) {
        this.loadZonesAvecJeux(zones);
      }
    });
  }

  private loadZoneTarifaires(festivalId: number): void {
    // Charger uniquement les zones tarifaires qui ont des réservations
    this._zoneTarifaireService.getZonesTarifairesWithReservations(festivalId).subscribe({
      next: (zones) => this.zoneTarifaires.set(zones),
      error: (err) => console.error('Erreur chargement zones tarifaires', err)
    });
  }

  private loadJeuxNonAlloues(festivalId: number): void {
    this._zonePlanService.getJeuxNonAlloues(festivalId).subscribe({
      next: (jeux) => this.jeuxNonAlloues.set(jeux),
      error: (err) => console.error('Erreur chargement jeux non alloués', err)
    });
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

  private loadZonesAvecJeux(zones: ZonePlanDto[]): void {
    const zonesAvec: ZonePlanAvecJeux[] = zones.map(z => ({
      ...z,
      jeuxAlloues: [],
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

  toggleZoneExpansion(zoneId: number): void {
    this.zonesAvecJeux.update(zones =>
      zones.map(z => z.id === zoneId ? { ...z, expanded: !z.expanded } : z)
    );
  }

  // Ouvrir le modal d'allocation pour une zone
  openAllocationModal(zone: ZonePlanAvecJeux): void {
    this.selectedZone.set(zone);
    this.selectedGame.set(null);
    this.placeOccupeeInput.set(1);
    this.nbExemplairesInput.set(1);
    this.tailleTableInput.set('standard');
    this.showAllocationModal.set(true);
    // Le stock est déjà chargé au niveau du festival
  }

  closeAllocationModal(): void {
    this.showAllocationModal.set(false);
    this.selectedZone.set(null);
    this.selectedGame.set(null);
  }

  selectGameForAllocation(game: AllocatedGameWithReservant): void {
    this.selectedGame.set(game);
    // Pré-remplir avec les valeurs existantes du jeu ou des valeurs par défaut
    // nb_tables_occupees contient le total, on suppose 1 place par exemplaire par défaut
    const nbExemplaires = Number(game.nb_exemplaires) || 1;
    const nbTables = Number(game.nb_tables_occupees) || 1;
    this.nbExemplairesInput.set(nbExemplaires);
    this.placeOccupeeInput.set(nbExemplaires > 0 ? nbTables / nbExemplaires : 1);
    this.tailleTableInput.set(game.taille_table_requise || 'standard');
  }

  // Allouer le jeu sélectionné à la zone
  allocateGame(): void {
    const zone = this.selectedZone();
    const game = this.selectedGame();
    const nbTables = this.tablesCalculees();
    const nbExemplaires = this.nbExemplairesInput();
    const tailleTable = this.tailleTableInput();
    
    if (!zone || !game) return;
    
    // Vérifier que les tables ne dépassent pas la capacité
    const tablesRestantes = this.tablesRestantesParZone()[zone.id] || 0;
    if (nbTables > tablesRestantes) {
      alert(`Pas assez de tables disponibles. Restantes: ${tablesRestantes}, Demandées: ${nbTables}`);
      return;
    }
    
    this.loading.set(true);
    this._zonePlanService.assignerJeuAZone(game.allocation_id, zone.id, nbTables, nbExemplaires, tailleTable).subscribe({
      next: () => {
        this.refreshData();
        this.closeAllocationModal();
      },
      error: (err) => {
        console.error('Erreur lors de l\'allocation', err);
        this.loading.set(false);
      }
    });
  }

  // Retirer un jeu d'une zone (le remettre dans les non alloués)
  removeGameFromZone(game: AllocatedGameWithReservant): void {
    this.loading.set(true);
    this._zonePlanService.assignerJeuAZone(game.allocation_id, null).subscribe({
      next: () => {
        this.refreshData();
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
    if (id !== null) {
      this._zonePlanService.getZonePlans(id);
      this.loadJeuxNonAlloues(id);
      this.loadStockTablesFestival(id);
      this.loadAllocationsSimple(id);
    }
    this.loading.set(false);
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
