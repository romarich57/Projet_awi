import { Component, inject, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FestivalDto } from '../../types/festival-dto';
import { FestivalService } from '@services/festival-service';
import { ZoneTarifaireDto } from '../../types/zone-tarifaire-dto';

@Component({
  selector: 'app-festival-form-component',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './festival-form-component.html',
  styleUrl: './festival-form-component.scss',
})
// Role : Gerer le formulaire de creation de festival et de zones tarifaires associees.
// Préconditions : Les services sont injectes et le formulaire est initialise.
// Postconditions : Les donnees valides sont transmises et le formulaire est reinitialise.
export class FestivalFormComponent {

  private readonly festivalService = inject(FestivalService);
  festivalSubmit = output<FestivalDto>(); //on envoie a festivalList le festival créé
  zoneSubmit = output<ZoneTarifaireDto>(); //on envoie a festivalList la zone créée


  readonly festivalForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
    }),
    stock_tables_standard: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    stock_tables_grande: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    stock_tables_mairie: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    stock_chaises: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    prix_prises: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    start_date: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    end_date: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    // FormArray pour gérer plusieurs zones tarifaires
    zones_tarifaires: new FormArray([
      this.createZoneFormGroup()
    ])
  });


  // Getter pour accéder au FormArray
  get zonesFormArray(): FormArray {
    return this.festivalForm.get('zones_tarifaires') as FormArray;
  }

  // Créer un FormGroup pour une zone tarifaire
  // Role : Construire un groupe de controles pour une zone tarifaire.
  // Préconditions : Aucune.
  // Postconditions : Retourne un FormGroup valide avec les controles necessaires.
  private createZoneFormGroup(): FormGroup {
    return new FormGroup({
      name: new FormControl('', [Validators.required]),
      nb_tables: new FormControl(1, [Validators.required, Validators.min(1)]),
      price_per_table: new FormControl(0, [Validators.required, Validators.min(0)]),
    });
  }

  // Ajouter une nouvelle zone tarifaire
  // Role : Ajouter une zone tarifaire au formulaire.
  // Préconditions : `zonesFormArray` est disponible.
  // Postconditions : Un nouveau groupe de controles est ajoute au FormArray.
  addZone(): void {
    this.zonesFormArray.push(this.createZoneFormGroup());
  }

  // Supprimer une zone tarifaire
  // Role : Supprimer une zone tarifaire par index.
  // Préconditions : L'index est dans les limites du FormArray.
  // Postconditions : La zone est retiree si au moins une zone reste.
  removeZone(index: number): void {
    if (this.zonesFormArray.length > 1) {
      this.zonesFormArray.removeAt(index);
    }
  }

  // Role : Soumettre le formulaire et creer le festival puis ses zones.
  // Préconditions : Le formulaire est valide; le service FestivalService est disponible.
  // Postconditions : Le festival est cree, les zones sont creees, et le formulaire est reinitialise.
  submit(): void {
    if (this.festivalForm.valid) {
      const formValue = this.festivalForm.getRawValue();
      const festivalName = String(formValue.name || '').trim();
      const normalizedName = festivalName.toLowerCase();
      const nameExists = this.festivalService
        .festivals()
        .some((festival) => festival.name.trim().toLowerCase() === normalizedName);
      if (festivalName && nameExists) {
        alert('Un festival avec ce nom existe deja.');
        return;
      }

      // Créer le festival avec les bonnes conversions
      const startDate = String(formValue.start_date || new Date().toISOString().split('T')[0]);
      const endDate = String(formValue.end_date || new Date().toISOString().split('T')[0]);
      const festival: Partial<FestivalDto> = {
        name: festivalName,
        stock_tables_standard: Number(formValue.stock_tables_standard) || 0,
        stock_tables_grande: Number(formValue.stock_tables_grande) || 0,
        stock_tables_mairie: Number(formValue.stock_tables_mairie) || 0,
        stock_chaises: Number(formValue.stock_chaises) || 0,
        prix_prises: Number(formValue.prix_prises) || 0,
        start_date: startDate,
        end_date: endDate,
      };

      // Créer les zones tarifaires (sans festival_id pour l'instant)
      const zones: Partial<ZoneTarifaireDto>[] = this.zonesFormArray.value.map((zone: { name: string, nb_tables: number, price_per_table: number, m2_price: number }) => ({
        name: zone.name,
        nb_tables: Number(zone.nb_tables) || 0,
        price_per_table: Number(zone.price_per_table) || 0,
        m2_price: Number(zone.m2_price) || 0,
      }));

      // Nouvelle approche : Festival d'abord, puis zones une par une
      this.festivalService.addFestival(festival).subscribe({
        next: (festivalResponse) => {
          console.log('Festival créé avec succès:', festivalResponse.festival);
          const festivalId = festivalResponse.festival.id;

          // Émettre l'événement festival
          this.festivalSubmit.emit(festivalResponse.festival);

          // Ensuite créer chaque zone avec l'ID du festival
          zones.forEach(zone => {
            this.festivalService.addZoneTarifaire(zone, festivalId).subscribe({
              next: (zoneResponse) => {
                console.log('Zone tarifaire créée:', zoneResponse.zone_tarifaire);
              },
              error: (err) => {
                console.error('Erreur lors de la création d\'une zone:', err);
              }
            });
          });

          // Réinitialiser le formulaire
          this.festivalForm.reset();

          // Réinitialiser les zones (garder une zone vide)
          while (this.zonesFormArray.length > 1) {
            this.zonesFormArray.removeAt(1);
          }
          this.zonesFormArray.at(0).reset();
        },
        error: (err) => {
          if (err?.status === 409) {
            alert('Un festival avec ce nom existe deja.');
            return;
          }
          console.error('Erreur lors de la création du festival:', err);
          alert('Erreur lors de la création du festival. Veuillez réessayer.');
        }
      });
    } else {
      console.log('Formulaire invalide:', this.festivalForm.errors);
    }
  }



}
