import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ZonePlanService } from '@app/services/zone-plan-service';
import { ZoneTarifaireService } from '@app/services/zone-tarifaire.service';
import { ZonePlanForm } from '../zone-plan-form/zone-plan-form';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { ZonePlanDto } from '@app/types/zone-plan-dto';

@Component({
  selector: 'app-zone-plan-jeux',
  imports: [ZonePlanForm],
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
      }
    });
  }

  private loadZoneTarifaires(festivalId: number): void {
    this._zoneTarifaireService.getZonesTarifaires(festivalId).subscribe({
      next: (zones) => this.zoneTarifaires.set(zones),
      error: (err) => console.error('Erreur chargement zones tarifaires', err)
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

