import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map } from 'rxjs';
import { GameApiService, GamePayload } from '@app/services/game-api';
import { EditorApiService } from '@app/services/editor-api';
import { UploadService } from '@app/services/upload.service';
import { ensureHttpsUrl } from '@app/shared/utils/https-url';
import type { MechanismDto } from '@app/types/mechanism-dto';
import type { EditorDto } from '@app/types/editor-dto';
import type { GameDto } from '@app/types/game-dto';
import type { GameFormModel } from '@app/types/game-edit.types';

export type ImageSource = 'url' | 'file';

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

@Injectable()
export class GameEditStore {
  private readonly gameApi = inject(GameApiService);
  private readonly editorApi = inject(EditorApiService);
  private readonly uploadService = inject(UploadService);

  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mechanisms = signal<MechanismDto[]>([]);
  private readonly _editors = signal<EditorDto[]>([]);
  private readonly _gameTitle = signal<string>('');
  private readonly _formData = signal<GameFormModel>({ ...DEFAULT_FORM });
  private readonly _imageSource = signal<ImageSource>('url');
  private readonly _imagePreview = signal<string>('');

  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mechanisms = this._mechanisms.asReadonly();
  readonly editors = this._editors.asReadonly();
  readonly gameTitle = this._gameTitle.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly imageSource = this._imageSource.asReadonly();
  readonly imagePreview = computed(() => this._imagePreview() || this._formData().image_url);
  readonly isUploadingImage = this.uploadService.isUploading;
  readonly imageUploadError = this.uploadService.uploadError;

  init(gameId: number): void {
    this.loadReferenceData();
    if (!Number.isFinite(gameId)) {
      this._error.set('Identifiant de jeu invalide');
      return;
    }
    this.fetchGame(gameId);
  }

  setFormData(formData: GameFormModel): void {
    this._formData.set({ ...formData, mechanismIds: [...formData.mechanismIds] });
  }

  setImageSource(source: ImageSource): void {
    this._imageSource.set(source);
    if (source === 'url') {
      this._imagePreview.set('');
      this.uploadService.uploadError.set(null);
    }
  }

  selectImageFile(file: File | null): void {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.uploadService.uploadError.set('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.uploadService.uploadError.set("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    this._imageSource.set('file');
    this.uploadService.uploadError.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      this._imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    this.uploadService.uploadGameImage(file).subscribe((url) => {
      if (url) {
        this.setFormData({ ...this._formData(), image_url: url });
      }
    });
  }

  save(gameId: number): Observable<void> {
    if (!Number.isFinite(gameId)) {
      this._error.set('Identifiant de jeu invalide');
      return EMPTY;
    }

    const payload = this.buildPayload();
    if (!payload.title || !payload.type || payload.editor_id === null) {
      this._error.set('Merci de remplir les champs requis');
      return EMPTY;
    }

    this._saving.set(true);
    this._error.set(null);
    return this.gameApi.update(gameId, payload).pipe(
      map(() => undefined as void),
      catchError((err) => {
        this._error.set(err.message || "Erreur lors de l'enregistrement");
        return EMPTY;
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private loadReferenceData(): void {
    this.gameApi.listMechanisms().subscribe({
      next: (items) => this._mechanisms.set(items),
      error: (err) => console.error('Erreur chargement mécanismes', err),
    });
    this.editorApi.list().subscribe({
      next: (items) => this._editors.set(items),
      error: (err) => console.error('Erreur chargement éditeurs', err),
    });
  }

  private fetchGame(id: number): void {
    this._loading.set(true);
    this._error.set(null);
    this.gameApi
      .get(id)
      .subscribe({
        next: (game) => {
          this._gameTitle.set(game.title);
          this.fillForm(game);
        },
        error: (err) => {
          this._error.set(err.message || 'Jeu introuvable');
        },
      })
      .add(() => this._loading.set(false));
  }

  private fillForm(game: GameDto): void {
    this._formData.set({
      title: game.title,
      type: game.type,
      editor_id: game.editor_id ? String(game.editor_id) : '',
      min_age: game.min_age,
      authors: game.authors,
      min_players: game.min_players ?? null,
      max_players: game.max_players ?? null,
      prototype: game.prototype,
      duration_minutes: game.duration_minutes ?? null,
      theme: game.theme ?? '',
      description: game.description ?? '',
      image_url: game.image_url ?? '',
      rules_video_url: game.rules_video_url ?? '',
      mechanismIds: game.mechanisms?.map((m) => m.id) ?? [],
    });
    this._imageSource.set('url');
    this._imagePreview.set('');
  }

  private buildPayload(): GamePayload {
    const form = this._formData();
    const toNumber = (value: number | null) =>
      value === null || Number.isNaN(value) ? null : Number(value);

    const imageUrl = ensureHttpsUrl(form.image_url);

    return {
      title: form.title.trim(),
      type: form.type.trim(),
      editor_id: form.editor_id ? Number(form.editor_id) : null,
      min_age: form.min_age ?? 0,
      authors: form.authors.trim(),
      min_players: toNumber(form.min_players),
      max_players: toNumber(form.max_players),
      prototype: !!form.prototype,
      duration_minutes: toNumber(form.duration_minutes),
      theme: form.theme.trim() || undefined,
      description: form.description.trim() || undefined,
      image_url: imageUrl || undefined,
      rules_video_url: form.rules_video_url.trim() || undefined,
      mechanismIds: form.mechanismIds,
    };
  }
}
