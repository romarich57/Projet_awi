import { Component, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FestivalCardComponent } from '../festival-card-component/festival-card-component';
import { FestivalService } from '../../services/festival-service';
import { FestivalFormComponent } from '../festival-form-component/festival-form-component';
import { FestivalDto } from '../../types/festival-dto';
import { ZoneTarifaireDto } from '../../types/zone-tarifaire-dto';
import { AuthService } from '../../services/auth.service';
import { FestivalState } from '../../stores/festival-state';

@Component({
  selector: 'app-festival-list-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FestivalCardComponent, FestivalFormComponent],
  templateUrl: './festival-list-component.html',
  styleUrl: './festival-list-component.scss',
})
// Role : Afficher la liste des festivals et piloter l'ajout via un formulaire.
// Préconditions : Les services FestivalService/AuthService sont injectes.
// Postconditions : La liste est chargee et les actions d'ajout mettent a jour l'etat.
export class FestivalListComponent {

  private readonly _festivalService = inject(FestivalService);
  private readonly _authService = inject(AuthService);
  private readonly _festivalState = inject(FestivalState);
  private readonly _router = inject(Router);
  readonly festivals = this._festivalService.festivals;
  readonly isLoggedIn = this._authService.isLoggedIn;
  readonly canDeleteFestival = this._authService.isSuperOrganizer;

  constructor() {
    if (!this.isLoggedIn()) {
      effect(() => this._festivalService.loadLastFestival());
    }
    else {
      effect(() => this._festivalService.loadAllFestivals());
    }
  }


  showForm = signal(false);
  // Role : Afficher ou masquer le formulaire d'ajout.
  // Préconditions : `showForm` est initialise.
  // Postconditions : L'etat d'affichage est bascule.
  toggleForm(): void {
    // Logique pour afficher ou masquer le formulaire d'ajout de festival
    this.showForm.update(show => !show);
  }

  // Role : Ajouter un festival via le service.
  // Préconditions : Un objet `festival` valide est fourni.
  // Postconditions : Le festival est cree et le formulaire est masque en cas de succes.
  addFestival(festival: FestivalDto): void {
    if (!festival) {
      return;
    }
    this.showForm.set(false);
  }

  // Role : Ajouter une zone tarifaire pour un festival.
  // Préconditions : `zone_tarifaire` et `festival_id` sont valides.
  // Postconditions : La zone est creee via le service.
  addZoneTarifaire(zone_tarifaire: ZoneTarifaireDto, festival_id: number): void {
    if (!zone_tarifaire || !festival_id) {
      return;
    }
  }

  // Role : Supprimer un festival et nettoyer l'etat courant si besoin.
  // Préconditions : festivalId est valide et l'utilisateur est autorise.
  // Postconditions : Le festival est supprime et l'etat courant est mis a jour.
  deleteFestival(festivalId: number): void {
    if (!festivalId) {
      return;
    }
    const confirmation = window.confirm('Supprimer ce festival et toutes ses dependances ?');
    if (!confirmation) {
      return;
    }
    this._festivalService.deleteFestival(festivalId).subscribe({
      next: () => {
        const currentFestival = this._festivalState.currentFestival();
        if (currentFestival?.id === festivalId) {
          this._festivalState.setCurrentFestival(null);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du festival', err);
      },
    });
  }



}
