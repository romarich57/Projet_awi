import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ZonePlanService } from '@app/services/zone-plan-service';
import { ZonePlanDto } from '@app/types/zone-plan-dto';
import type { ZoneTarifaireDto } from '@app/types/zone-tarifaire-dto';

@Component({
  selector: 'app-zone-plan-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './zone-plan-form.html',
  styleUrl: './zone-plan-form.scss'
})
// Role : Gerer le formulaire de creation/edition d'un plan de zone.
// Préconditions : `festivalId` et les listes de zones/tables restantes sont fournis.
// Postconditions : Le plan de zone est cree ou mis a jour et les evenements sont emis.
export class ZonePlanForm {

  private readonly zonePlanService = inject(ZonePlanService);
  
  festivalId = input.required<number>();
  zoneTarifaires = input<ZoneTarifaireDto[]>([]);
  tablesRestantes = input<Record<number, number>>({});
  zonePlanToEdit = input<ZonePlanDto | null>(null);
  
  formClosed = output<void>();
  zonePlanCreated = output<void>();

  constructor() {
    // Pré-remplir le formulaire si on est en mode édition
    effect(() => {
      const zone = this.zonePlanToEdit();
      if (zone) {
        this.zonePlanForm.patchValue({ //patchValue permet de ne pas toucher aux autres champs non specifiés
          name: zone.name,
          nb_tables: zone.nb_tables,
          id_zone_tarifaire: zone.id_zone_tarifaire //
        });
      } else {
        this.zonePlanForm.reset();
      }
    });
  }

  // Getter pour savoir si on est en mode édition
  get isEditMode(): boolean {
    return this.zonePlanToEdit() !== null;
  }

  // Validateur personnalisé pour vérifier que nb_tables <= tables disponibles
  // Role : Verifier que le nombre de tables ne depasse pas le stock disponible.
  // Préconditions : Les donnees de tables restantes et la zone a editer sont connues.
  // Postconditions : Retourne une erreur de validation si le stock est depasse.
  private tablesExceededValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const formGroup = group as FormGroup;
      const nbTables = formGroup.get('nb_tables')?.value;
      const ztId = formGroup.get('id_zone_tarifaire')?.value;
      
      if (ztId === null || nbTables === null) return null;
      
      let maxDisponible = this.tablesRestantes()[ztId] ?? 0;
      
      // En mode édition, ajouter les tables de la zone qu'on édite si même zone tarifaire
      const zoneToEdit = this.zonePlanToEdit();
      if (zoneToEdit && zoneToEdit.id_zone_tarifaire === ztId) {
        maxDisponible += zoneToEdit.nb_tables;
      }
      
      if (nbTables > maxDisponible) {
        return { tablesExceeded: { max: maxDisponible, actual: nbTables } };
      }
      return null;
    };
  }

  readonly zonePlanForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
    }),
    nb_tables: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    id_zone_tarifaire: new FormControl<number | null>(null, {
      validators: [Validators.required]
    })
  }, { validators: this.tablesExceededValidator() });

  // Role : Soumettre le formulaire et creer/mettre a jour le plan de zone.
  // Préconditions : Le formulaire est valide.
  // Postconditions : Le plan est enregistre et le formulaire est ferme.
  submit(): void {
    if (this.zonePlanForm.valid) {
      const formValue = this.zonePlanForm.getRawValue();
      
      const zonePlan = {
        name: formValue.name,
        nb_tables: Number(formValue.nb_tables),
        id_zone_tarifaire: Number(formValue.id_zone_tarifaire),
        festival_id: this.festivalId()
      };

      const zoneToEdit = this.zonePlanToEdit();
      if (zoneToEdit) {
        // Mode édition
        this.zonePlanService.setZonePlan(zoneToEdit.id, zonePlan, this.festivalId());
      } else {
        // Mode création
        this.zonePlanService.addZonePlan(zonePlan, this.festivalId());
      }
      
      this.zonePlanCreated.emit();
      this.close();
    }
  }

  // Role : Fermer le formulaire et notifier le parent.
  // Préconditions : Aucune.
  // Postconditions : Le formulaire est reinitialise et `formClosed` est emis.
  close(): void {
    this.zonePlanForm.reset();
    this.formClosed.emit();
  }
}
