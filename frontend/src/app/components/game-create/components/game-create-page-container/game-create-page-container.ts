import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
export class GameCreatePageContainerComponent implements OnInit {
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

  ngOnInit(): void {
    this.store.loadReferenceData();
  }

  onBack(): void {
    this.router.navigate(['/games']);
  }

  onCancel(): void {
    this.router.navigate(['/games']);
  }

  onPatch(partial: Partial<GameFormModel>): void {
    this.store.patchForm(partial);
  }

  onImageSourceChanged(source: ImageSource): void {
    this.store.setImageSource(source);
  }

  onImageFileSelected(file: File | null): void {
    this.store.selectImageFile(file);
  }

  onSubmit(): void {
    this.store.save().subscribe({
      next: () => this.router.navigate(['/games']),
    });
  }
}
