import { Component, inject, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FestivalDto } from '../../types/festival-dto';
import { FestivalService } from '../../services/festival-service';
import { ZoneTarifaireDto } from '../../types/zone-tarifaire-dto';

@Component({
  selector: 'app-festival-form-component',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './festival-form-component.html',
  styleUrl: './festival-form-component.scss',
})
export class FestivalFormComponent {

  private readonly festivalService = inject(FestivalService);
  festivalSubmit = output<FestivalDto>(); //on envoie a festivalList le festival créé
  zoneSubmit = output<any>(); //on envoie a festivalList la zone créée

  readonly festivalForm = new FormGroup({

    name: new FormControl('', 
      {nonNullable:  true, 
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)]}),
    
    stock_tables_standard: new FormControl(0, 
      {nonNullable: true,
      validators: [Validators.required, Validators.min(0)]}),
    
    stock_tables_grande: new FormControl(0, 
      {nonNullable: true,
      validators: [Validators.required, Validators.min(0)]}),
    
    stock_tables_mairie: new FormControl(0, 
      {nonNullable: true,
      validators: [Validators.required, Validators.min(0)]}),
    
    stock_chaises: new FormControl(0, 
      {nonNullable: true,
      validators: [Validators.required, Validators.min(0)]}),
    
    start_date: new FormControl('', 
      {nonNullable: true,
      validators: [Validators.required]}),
    
    end_date: new FormControl('', 
      {nonNullable: true,
      validators: [Validators.required]}),

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
  private createZoneFormGroup(): FormGroup {
    return new FormGroup({
      name: new FormControl('', [Validators.required]),
      nb_tables: new FormControl(0, [Validators.required, Validators.min(1)]),
      price_per_table: new FormControl(0, [Validators.required, Validators.min(0)]),
    });
  }

  // Ajouter une nouvelle zone tarifaire
  addZone(): void {
    this.zonesFormArray.push(this.createZoneFormGroup());
  }

  // Supprimer une zone tarifaire
  removeZone(index: number): void {
    if (this.zonesFormArray.length > 1) {
      this.zonesFormArray.removeAt(index);
    }
  }

  submit(): void {
    if (this.festivalForm.valid) {
      const formValue = this.festivalForm.value as any;
      
      // Créer le festival avec les bonnes conversions
      const festival: Partial<FestivalDto> = {
        name: formValue.name || '',
        stock_tables_standard: Number(formValue.stock_tables_standard) || 0,
        stock_tables_grande: Number(formValue.stock_tables_grande) || 0,
        stock_tables_mairie: Number(formValue.stock_tables_mairie) || 0,
        stock_chaises: Number(formValue.stock_chaises) || 0,
        start_date: new Date(formValue.start_date || new Date().toISOString().split('T')[0]),
        end_date: new Date(formValue.end_date || new Date().toISOString().split('T')[0]),
      };
      
      // Créer les zones tarifaires (sans festival_id pour l'instant)
      const zones: Partial<ZoneTarifaireDto>[] = this.zonesFormArray.value.map((zone: any) => ({
        name: zone.name || '',
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
          console.error('Erreur lors de la création du festival:', err);
          alert('Erreur lors de la création du festival. Veuillez réessayer.');
        }
      });
    } else {
      console.log('Formulaire invalide:', this.festivalForm.errors);
    }
  }



}
