import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FestivalCardComponent } from '../festival-card-component/festival-card-component';
import { FestivalService } from '../../services/festival-service';
import { FestivalFormComponent } from '../festival-form-component/festival-form-component';
import { FestivalDto } from '../../types/festival-dto';
import { ZoneTarifaireDto } from '../../types/zone-tarifaire-dto';

@Component({
  selector: 'app-festival-list-component',
  standalone: true,
  imports: [FestivalCardComponent, FestivalFormComponent],
  templateUrl: './festival-list-component.html',
  styleUrl: './festival-list-component.scss',
})
export class FestivalListComponent {

  private readonly _festivalService = inject(FestivalService);
  private readonly _router = inject(Router);
  readonly festivals = this._festivalService.festivals;

  constructor() {
    effect(() => this._festivalService.loadAllFestivals());
  }


  showForm = signal(false);
  toggleForm(): void {
    // Logique pour afficher ou masquer le formulaire d'ajout de festival
    this.showForm.update(show => !show);
  }

  addFestival(festival: FestivalDto): void {
    this._festivalService.addFestival(festival).subscribe({
      next: (response) => {
        console.log('Festival ajouté:', response.festival);
        this.showForm.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du festival:', err);
      }
    });
    this.showForm.set(false);
  }

  addZoneTarifaire(zone_tarifaire: ZoneTarifaireDto, festival_id: number): void {
    this._festivalService.addZoneTarifaire(zone_tarifaire, festival_id).subscribe({
      next: (response) => {
        console.log('Zone tarifaire ajoutée:', response.zone_tarifaire);
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout de la zone tarifaire:', err);
      }
    });
  }



}
