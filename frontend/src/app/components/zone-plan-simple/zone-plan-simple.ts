import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZonePlanService, ZonePlanAllocationSummary, ZonePlanReservationAllocation } from '@app/services/zone-plan-service';
import { ZoneTarifaireService } from '@app/services/zone-tarifaire.service';
import { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';
import { ZonePlanDto } from '@app/types/zone-plan-dto';
import type { ReservationWithZones } from '@app/services/reservation.service';
import { m2ToTables, tablesToM2 } from '@app/shared/utils/table-conversion';
import { ZonePlanForm } from '../zone-plan-form/zone-plan-form';

@Component({
  selector: 'app-zone-plan-simple',
  imports: [ZonePlanForm, CommonModule, FormsModule],
  templateUrl: './zone-plan-simple.html',
  styleUrl: './zone-plan-simple.scss'
})
export class ZonePlanSimple {

  festivalId = input.required<number | null>();
  reservation = input<ReservationWithZones | null>(null);

  private readonly zonePlanService = inject(ZonePlanService);
  private readonly zoneTarifaireService = inject(ZoneTarifaireService);

  readonly zonePlans = this.zonePlanService.zonePlans;
  readonly zoneTarifaires = signal<ZoneTarifaireDto[]>([]);
  readonly allocations = signal<ZonePlanReservationAllocation[]>([]);
  readonly allocationsSummary = signal<ZonePlanAllocationSummary[]>([]);

  readonly showForm = signal(false);
  readonly zonePlanToEdit = signal<ZonePlanDto | null>(null);

  readonly showAllocationModal = signal(false);
  readonly selectedZone = signal<ZonePlanDto | null>(null);
  readonly inputMode = signal<'tables' | 'm2'>('tables');
  readonly tablesInput = signal<number>(0);
  readonly m2Input = signal<number>(0);
  readonly loading = signal(false);

  readonly tablesToM2 = tablesToM2;

  readonly tablesReserveesParZoneTarifaire = computed(() => {
    const reservation = this.reservation();
    const result: Record<number, number> = {};
    if (!reservation) return result;

    for (const zone of reservation.zones_tarifaires) {
      result[zone.zone_tarifaire_id] = Number(zone.nb_tables_reservees) || 0;
    }
    return result;
  });

  readonly tablesAlloueesParZone = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.allocations()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_tables) || 0;
    }
    return result;
  });

  readonly totalAlloueesParZone = computed(() => {
    const result: Record<number, number> = {};
    for (const allocation of this.allocationsSummary()) {
      result[allocation.zone_plan_id] = Number(allocation.nb_tables) || 0;
    }
    return result;
  });

  readonly tablesAlloueesParZoneTarifaire = computed(() => {
    const result: Record<number, number> = {};
    const zonePlans = this.zonePlans();
    const allocations = this.tablesAlloueesParZone();

    for (const zone of zonePlans) {
      const tables = allocations[zone.id] || 0;
      result[zone.id_zone_tarifaire] = (result[zone.id_zone_tarifaire] || 0) + tables;
    }

    return result;
  });

  readonly tablesUtiliseesParZoneTarifaire = computed(() => {
    const zonePlans = this.zonePlans();
    const result: Record<number, number> = {};

    for (const zp of zonePlans) {
      const ztId = zp.id_zone_tarifaire;
      result[ztId] = (result[ztId] || 0) + zp.nb_tables;
    }

    return result;
  });

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
      if (id == null) return;
      this.zonePlanService.getZonePlans(id);
      this.loadZoneTarifaires(id);
      this.loadAllocationsSummary(id);
    });

    effect(() => {
      const reservation = this.reservation();
      if (!reservation) return;
      this.loadAllocations(reservation.id);
    });
  }

  private loadZoneTarifaires(festivalId: number): void {
    this.zoneTarifaireService.getZonesTarifairesWithReservations(festivalId).subscribe({
      next: (zones) => this.zoneTarifaires.set(zones),
      error: (err) => console.error('Erreur chargement zones tarifaires', err)
    });
  }

  private loadAllocations(reservationId: number): void {
    this.zonePlanService.getReservationAllocations(reservationId).subscribe({
      next: (allocations) => this.allocations.set(allocations),
      error: (err) => console.error('Erreur chargement allocations simples', err)
    });
  }

  private loadAllocationsSummary(festivalId: number): void {
    this.zonePlanService.getFestivalAllocationsSummary(festivalId).subscribe({
      next: (allocations) => this.allocationsSummary.set(allocations),
      error: (err) => console.error('Erreur chargement allocations globales', err)
    });
  }

  private refreshAllocations(): void {
    const reservation = this.reservation();
    if (!reservation) return;
    this.loadAllocations(reservation.id);
    const festivalId = this.festivalId();
    if (festivalId != null) {
      this.loadAllocationsSummary(festivalId);
    }
    this.loading.set(false);
  }

  isZoneEligible(zone: ZonePlanDto): boolean {
    return (this.tablesReserveesParZoneTarifaire()[zone.id_zone_tarifaire] || 0) > 0;
  }

  tablesDisponiblesPourZone(zone: ZonePlanDto): number {
    const reservees = this.tablesReserveesParZoneTarifaire()[zone.id_zone_tarifaire] || 0;
    const alloueesDansZoneTarifaire = this.tablesAlloueesParZoneTarifaire()[zone.id_zone_tarifaire] || 0;
    const current = this.tablesAlloueesParZone()[zone.id] || 0;
    const totalAlloueesZone = this.totalAlloueesParZone()[zone.id] || 0;
    const maxParReservation = reservees - alloueesDansZoneTarifaire + current;
    const maxParZone = zone.nb_tables - totalAlloueesZone + current;
    return Math.max(0, Math.min(maxParReservation, maxParZone));
  }

  openAllocationModal(zone: ZonePlanDto): void {
    if (!this.isZoneEligible(zone)) return;
    this.selectedZone.set(zone);
    this.inputMode.set('tables');
    const currentTables = this.tablesAlloueesParZone()[zone.id] || 0;
    const availableTables = this.tablesDisponiblesPourZone(zone);
    const initialTables = currentTables || (availableTables > 0 ? 1 : 0);
    this.tablesInput.set(initialTables);
    this.m2Input.set(tablesToM2(initialTables));
    this.showAllocationModal.set(true);
  }

  closeAllocationModal(): void {
    this.showAllocationModal.set(false);
    this.selectedZone.set(null);
  }

  setInputMode(mode: 'tables' | 'm2'): void {
    this.inputMode.set(mode);
  }

  onTablesInputChange(value: number): void {
    const tables = Math.max(0, Math.floor(value || 0));
    this.tablesInput.set(tables);
    this.m2Input.set(tablesToM2(tables));
  }

  onM2InputChange(value: number): void {
    const m2Value = Math.max(0, Number(value) || 0);
    const tables = m2ToTables(m2Value);
    this.m2Input.set(m2Value);
    this.tablesInput.set(tables);
  }

  saveAllocation(): void {
    const zone = this.selectedZone();
    const reservation = this.reservation();
    if (!zone || !reservation) return;

    const nbTables = Math.max(0, Math.floor(this.tablesInput()));
    const maxTables = this.tablesDisponiblesPourZone(zone);
    if (nbTables <= 0) return;

    if (nbTables > maxTables) {
      alert(`Pas assez de tables disponibles. Max: ${maxTables}, Demandées: ${nbTables}`);
      return;
    }

    this.loading.set(true);
    this.zonePlanService.setReservationAllocation(reservation.id, zone.id, nbTables).subscribe({
      next: () => {
        this.refreshAllocations();
        this.closeAllocationModal();
      },
      error: (err) => {
        console.error('Erreur lors de l\'allocation simple', err);
        this.loading.set(false);
      }
    });
  }

  removeAllocation(zone: ZonePlanDto): void {
    const reservation = this.reservation();
    if (!reservation) return;
    if ((this.tablesAlloueesParZone()[zone.id] || 0) <= 0) return;

    this.loading.set(true);
    this.zonePlanService.deleteReservationAllocation(reservation.id, zone.id).subscribe({
      next: () => {
        this.refreshAllocations();
      },
      error: (err) => {
        console.error('Erreur lors du retrait', err);
        this.loading.set(false);
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
    if (id != null) {
      this.zonePlanService.getZonePlans(id);
    }
  }

  deleteZonePlan(zonePlanId: number): void {
    const id = this.festivalId();
    if (id != null) {
      this.zonePlanService.deleteZonePlan(zonePlanId, id);
    }
  }
}
