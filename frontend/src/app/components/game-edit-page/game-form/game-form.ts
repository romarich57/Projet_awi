import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { MechanismDto } from '../../../types/mechanism-dto';
import type { EditorDto } from '../../../types/editor-dto';
import type { GameFormModel } from '@app/types/game-edit.types';
import { GameMechanismsSelectComponent } from '@app/components/game-create/components/game-mechanisms-select/game-mechanisms-select';
import { ensureHttpsUrl } from '@app/shared/utils/https-url';

const DEFAULT_FORM: GameFormModel = {
  title: '',
  type: '',
  editor_id: '',
  min_age: 8,
  authors: '',
  min_players: null,
  max_players: null,
  prototype: false,
  duration_minutes: null,
  theme: '',
  description: '',
  image_url: '',
  rules_video_url: '',
  mechanismIds: [],
};

@Component({
  selector: 'app-game-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, GameMechanismsSelectComponent],
  templateUrl: './game-form.html',
  styleUrl: './game-form.scss',
})
export class GameFormComponent {
  readonly formData = input.required<GameFormModel>();
  readonly editors = input<readonly EditorDto[]>([]);
  readonly mechanisms = input<readonly MechanismDto[]>([]);
  readonly loading = input(false);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly imageSource = input<'url' | 'file'>('url');
  readonly imagePreview = input<string>('');
  readonly imageUploadError = input<string | null>(null);
  readonly isUploadingImage = input(false);
  readonly safeImagePreview = computed(() => ensureHttpsUrl(this.imagePreview()));

  readonly formDataChanged = output<GameFormModel>();
  readonly submitClicked = output<void>();
  readonly cancelClicked = output<void>();
  readonly imageSourceChanged = output<'url' | 'file'>();
  readonly imageFileSelected = output<File | null>();

  readonly localFormData = signal<GameFormModel>({ ...DEFAULT_FORM });

  constructor() {
    effect(() => {
      const data = this.formData();
      this.localFormData.set({ ...data, mechanismIds: [...data.mechanismIds] });
    });
  }

  updateForm(patch: Partial<GameFormModel>): void {
    const next = { ...this.localFormData(), ...patch };
    if (patch.mechanismIds) {
      next.mechanismIds = [...patch.mechanismIds];
    }
    this.localFormData.set(next);
    this.formDataChanged.emit(next);
  }

  submit(): void {
    this.submitClicked.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageFileSelected.emit(file);
    if (input) {
      input.value = '';
    }
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.cancelClicked.emit();
  }
}
