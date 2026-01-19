import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { GameEditHeaderComponent } from '../game-edit-header/game-edit-header';
import { GameFormComponent } from '../game-form/game-form';
import { GameEditStore, ImageSource } from '@app/stores/game-edit-store';
import type { GameFormModel } from '@app/types/game-edit.types';

@Component({
  selector: 'app-game-edit-page-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, GameEditHeaderComponent, GameFormComponent],
  templateUrl: './game-edit-page-container.html',
  styleUrl: './game-edit-page-container.scss',
  providers: [GameEditStore],
})
// Role : Orchestrer la page d'edition d'un jeu.
// Préconditions : La route contient l'id du jeu; GameEditStore est disponible.
// Postconditions : Les donnees sont chargees et la sauvegarde est declenchee.
export class GameEditPageContainerComponent {
  private readonly router = inject(Router);
  readonly store = inject(GameEditStore);

  readonly loading = this.store.loading;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly mechanisms = this.store.mechanisms;
  readonly editors = this.store.editors;
  readonly gameTitle = this.store.gameTitle;
  readonly formData = this.store.formData;
  readonly imageSource = this.store.imageSource;
  readonly imagePreview = this.store.imagePreview;
  readonly imageUploadError = this.store.imageUploadError;
  readonly isUploadingImage = this.store.isUploadingImage;

  readonly id = input<string | null>(null);
  private readonly gameId = computed(() => {
    const idParam = this.id();
    const parsed = idParam ? Number(idParam) : Number.NaN;
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  });

  constructor() {
    effect(() => {
      const gameId = this.gameId();
      if (!Number.isNaN(gameId)) {
        this.store.init(gameId);
      }
    });
  }

  // Role : Revenir a la liste des jeux.
  // Préconditions : Le routeur est disponible.
  // Postconditions : La navigation est declenchee.
  onBackClicked(): void {
    this.router.navigate(['/games']);
  }

  // Role : Annuler l'edition et revenir a la liste.
  // Préconditions : Le routeur est disponible.
  // Postconditions : La navigation est declenchee.
  onCancelClicked(): void {
    this.router.navigate(['/games']);
  }

  // Role : Mettre a jour les donnees du formulaire dans le store.
  // Préconditions : `formData` est conforme au modele.
  // Postconditions : Le store est synchronise avec le formulaire.
  onFormDataChanged(formData: GameFormModel): void {
    this.store.setFormData(formData);
  }

  // Role : Mettre a jour la source d'image.
  // Préconditions : `source` est une valeur valide.
  // Postconditions : Le store enregistre la source selectionnee.
  onImageSourceChanged(source: ImageSource): void {
    this.store.setImageSource(source);
  }

  // Role : Recevoir un fichier image selectionne.
  // Préconditions : Le fichier peut etre null.
  // Postconditions : Le store stocke le fichier selectionne.
  onImageFileSelected(file: File | null): void {
    this.store.selectImageFile(file);
  }

  // Role : Soumettre les modifications du jeu.
  // Préconditions : Le store a un formulaire valide.
  // Postconditions : La sauvegarde est declenchee et la navigation est faite en cas de succes.
  onSubmit(): void {
    const gameId = this.gameId();
    if (Number.isNaN(gameId)) {
      return;
    }
    this.store.save(gameId).subscribe({
      next: () => this.router.navigate(['/games']),
    });
  }
}
