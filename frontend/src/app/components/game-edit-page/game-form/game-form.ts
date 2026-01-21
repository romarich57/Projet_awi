import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { MechanismDto } from '../../../types/mechanism-dto';
import type { EditorDto } from '../../../types/editor-dto';
import type { GameFormModel } from '@app/types/game-edit.types';
import { GameMechanismsSelectComponent } from '@app/components/game-create/components/game-mechanisms-select/game-mechanisms-select';
import { ensureHttpsUrl } from '@app/shared/utils/https-url';
import { GameVideoPreviewComponent } from '@app/components/game-create/components/game-video-preview/game-video-preview';

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
  imports: [CommonModule, FormsModule, GameMechanismsSelectComponent, GameVideoPreviewComponent],
  templateUrl: './game-form.html',
  styleUrl: './game-form.scss',
})
// Role : Gerer le formulaire d'edition d'un jeu.
// Préconditions : Les donnees du jeu et les listes d'editeurs/mecanismes sont fournies.
// Postconditions : Les modifications sont emises et les actions utilisateur sont notifiees.
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
  readonly titleInitial = computed(() => {
    const title = this.localFormData().title?.trim();
    return title ? title.charAt(0) : '?';
  });

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

  // Role : Mettre a jour le formulaire local et emettre les changements.
  // Préconditions : `patch` contient des champs valides du modele.
  // Postconditions : `localFormData` est mis a jour et l'evenement est emis.
  updateForm(patch: Partial<GameFormModel>): void {
    const next = { ...this.localFormData(), ...patch };
    if (patch.mechanismIds) {
      next.mechanismIds = [...patch.mechanismIds];
    }
    this.localFormData.set(next);
    this.formDataChanged.emit(next);
  }

  // Role : Notifier la soumission du formulaire.
  // Préconditions : Le parent ecoute `submitClicked`.
  // Postconditions : L'evenement de soumission est emis.
  submit(): void {
    this.submitClicked.emit();
  }

  // Role : Recuperer un fichier image choisi par l'utilisateur.
  // Préconditions : L'evenement provient d'un input file.
  // Postconditions : Le fichier est emis et l'input est reinitialise.
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageFileSelected.emit(file);
    if (input) {
      input.value = '';
    }
  }

  // Role : Annuler l'edition et informer le parent.
  // Préconditions : L'evenement provient du lien/bouton d'annulation.
  // Postconditions : L'evenement `cancelClicked` est emis.
  onCancel(event: Event): void {
    event.preventDefault();
    this.cancelClicked.emit();
  }
}
