import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ZonePlanService, AllocatedGameWithReservant } from '@app/services/zone-plan-service';
import { ZoneTarifaireService } from '@app/services/zone-tarifaire.service';
import { ZonePlanForm } from '../zone-plan-form/zone-plan-form';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { ZonePlanDto } from '@app/types/zone-plan-dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  readonly nbTablesInput = signal<number>(1);
  readonly loading = signal(false);

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
    this._zoneTarifaireService.getZonesTarifaires(festivalId).subscribe({
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
    const result: Record<number, number> = {};
    
    for (const zone of zones) {
      result[zone.id] = zone.jeuxAlloues.reduce((sum, jeu) => sum + jeu.nb_tables_occupees, 0);
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
    this.nbTablesInput.set(1);
    this.showAllocationModal.set(true);
  }

  closeAllocationModal(): void {
    this.showAllocationModal.set(false);
    this.selectedZone.set(null);
    this.selectedGame.set(null);
  }

  selectGameForAllocation(game: AllocatedGameWithReservant): void {
    this.selectedGame.set(game);
    this.nbTablesInput.set(game.nb_tables_occupees);
  }

  // Allouer le jeu sélectionné à la zone
  allocateGame(): void {
    const zone = this.selectedZone();
    const game = this.selectedGame();
    const nbTables = this.nbTablesInput();
    
    if (!zone || !game) return;
    
    this.loading.set(true);
    this._zonePlanService.assignerJeuAZone(game.allocation_id, zone.id, nbTables).subscribe({
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

