import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { EditorDto } from '../../../../types/editor-dto';
import type { GameFormModel } from '../../../../stores/game-create.store';

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
  selector: 'app-game-create-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-create-form.html',
  styleUrl: './game-create-form.scss',
})
export class GameCreateFormComponent {
  readonly formData = input.required<GameFormModel>();
  readonly editors = input<readonly EditorDto[]>([]);
  readonly lockEditor = input(false);
  readonly lockedEditorName = input<string | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly imageSource = input<'url' | 'file'>('url');
  readonly imageUploadError = input<string | null>(null);
  readonly isUploadingImage = input(false);

  readonly patch = output<Partial<GameFormModel>>();
  readonly submit = output<void>();
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

  updateForm(partial: Partial<GameFormModel>): void {
    const next = { ...this.localFormData(), ...partial };
    if (partial.mechanismIds) {
      next.mechanismIds = [...partial.mechanismIds];
    }
    this.localFormData.set(next);
    const payload = partial.mechanismIds
      ? { ...partial, mechanismIds: [...partial.mechanismIds] }
      : partial;
    this.patch.emit(payload);
  }

  submitForm(): void {
    this.submit.emit();
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
