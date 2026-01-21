import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameCreateStore, GameFormModel, ImageSource } from '../../../../stores/game-create.store';
import { GameCreateHeaderComponent } from '../game-create-header/game-create-header';
import { GameCreateFormComponent } from '../game-create-form/game-create-form';
import { GameImagePreviewComponent } from '../game-image-preview/game-image-preview';
import { GameMechanismsSelectComponent } from '../game-mechanisms-select/game-mechanisms-select';

@Component({
  selector: 'app-game-create-page-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    GameCreateHeaderComponent,
    GameCreateFormComponent,
    GameImagePreviewComponent,
    GameMechanismsSelectComponent,
  ],
  templateUrl: './game-create-page-container.html',
  styleUrl: './game-create-page-container.scss',
  providers: [GameCreateStore],
})
// Role : Orchestrer la page de creation d'un jeu.
// Préconditions : GameCreateStore est disponible et les sous-composants sont importes.
// Postconditions : Les donnees de reference sont chargees et la creation est declenchee.
export class GameCreatePageContainerComponent {
  private readonly router = inject(Router);
  readonly store = inject(GameCreateStore);

  readonly formData = this.store.formData;
  readonly editors = this.store.editors;
  readonly mechanisms = this.store.mechanisms;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly imageSource = this.store.imageSource;
  readonly imagePreview = this.store.imagePreview;
  readonly imageUploadError = this.store.imageUploadError;
  readonly isUploadingImage = this.store.isUploadingImage;

  constructor() {
    effect(() => {
      this.store.loadReferenceData();
    });
  }

  // Role : Revenir a la liste des jeux.
  // Préconditions : Le routeur est disponible.
  // Postconditions : La navigation est declenchee.
  onBack(): void {
    this.router.navigate(['/games']);
  }

  // Role : Annuler la creation et revenir a la liste.
  // Préconditions : Le routeur est disponible.
  // Postconditions : La navigation est declenchee.
  onCancel(): void {
    this.router.navigate(['/games']);
  }

  // Role : Mettre a jour une partie du formulaire.
  // Préconditions : `partial` contient des champs valides.
  // Postconditions : Le store applique le patch.
  onPatch(partial: Partial<GameFormModel>): void {
    this.store.patchForm(partial);
  }

  // Role : Modifier la source de l'image.
  // Préconditions : `source` est une valeur valide.
  // Postconditions : Le store enregistre la source.
  onImageSourceChanged(source: ImageSource): void {
    this.store.setImageSource(source);
  }

  // Role : Recevoir un fichier image selectionne.
  // Préconditions : Le fichier peut etre null.
  // Postconditions : Le store stocke le fichier selectionne.
  onImageFileSelected(file: File | null): void {
    this.store.selectImageFile(file);
  }

  // Role : Soumettre la creation du jeu.
  // Préconditions : Le store a un formulaire valide.
  // Postconditions : Le jeu est cree et la navigation est lancee.
  onSubmit(): void {
    if (this.saving() || this.isUploadingImage()) {
      return;
    }
    this.store.save().subscribe({
      next: () => this.router.navigate(['/games']),
    });
  }
}
