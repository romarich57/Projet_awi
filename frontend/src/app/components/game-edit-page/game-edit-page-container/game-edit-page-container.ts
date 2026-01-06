import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
export class GameEditPageContainerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
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

  private gameId = NaN;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.gameId = idParam ? Number(idParam) : NaN;
    this.store.init(this.gameId);
  }

  onBackClicked(): void {
    this.router.navigate(['/games']);
  }

  onCancelClicked(): void {
    this.router.navigate(['/games']);
  }

  onFormDataChanged(formData: GameFormModel): void {
    this.store.setFormData(formData);
  }

  onImageSourceChanged(source: ImageSource): void {
    this.store.setImageSource(source);
  }

  onImageFileSelected(file: File | null): void {
    this.store.selectImageFile(file);
  }

  onSubmit(): void {
    this.store.save(this.gameId).subscribe({
      next: () => this.router.navigate(['/games']),
    });
  }
}
