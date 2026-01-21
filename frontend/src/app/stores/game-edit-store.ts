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

 

  // Role : Initialiser le store pour l'edition d'un jeu.
  // Preconditions : gameId doit etre valide.
  // Postconditions : Charge les donnees de reference et les donnees du jeu.
  init(gameId: number): void {
    this.loadReferenceData();
    if (!Number.isFinite(gameId)) {
      this._error.set('Identifiant de jeu invalide');
      return;
    }
    this.fetchGame(gameId);
  }

  // Role : Remplir le formulaire avec les donnees fournies.
  // Preconditions : Un objet GameFormModel valide est fourni.
  // Postconditions : Le signal _formData est mis a jour.
  setFormData(formData: GameFormModel): void {
    this._formData.set({ ...formData, mechanismIds: [...formData.mechanismIds] });
  }

  // Role : Definir la source de l'image et reinitialiser l'apercu si besoin.
  // Preconditions : La source est soit 'url' soit 'file'.
  // Postconditions : Les signaux _imageSource et _imagePreview sont ajustes.
  setImageSource(source: ImageSource): void {
    this._imageSource.set(source);
    if (source === 'url') {
      this._imagePreview.set('');
      this.uploadService.uploadError.set(null);
    }
  }

  // Role : Traiter le fichier image selectionne par l'utilisateur.
  // Preconditions : Le fichier doit etre une image valide et ne pas depasser 2 Mo.
  // Postconditions : Si valide, uploade l'image et met a jour l'URL de l'image dans le formulaire. Sinon, signale une erreur.
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

  // Role : Sauvegarder les modifications du jeu.
  // Preconditions : gameId est valide et le formulaire contient les champs requis.
  // Postconditions : L'API est appelee et l'etat de sauvegarde est mis a jour.
  save(gameId: number): Observable<void> {
    if (this._saving()) {
      return EMPTY;
    }
    if (!Number.isFinite(gameId)) {
      this._error.set('Identifiant de jeu invalide');
      return EMPTY;
    }

    const payload = this.buildPayload();
    const validationErrors = this.getValidationErrors(payload);
    if (validationErrors.length > 0) {
      this._error.set(validationErrors.join(' · '));
      return EMPTY;
    }

    this._saving.set(true);
    this._error.set(null);
    return this.gameApi.update(gameId, payload).pipe(
      map(() => undefined as void),
      catchError((err) => {
        if (err?.status !== 409) {
          console.error('Erreur lors de la mise a jour du jeu', err);
        }
        this._error.set(this.extractErrorMessage(err) || "Erreur lors de l'enregistrement");
        return EMPTY;
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  // Role : Charger les donnees de reference (mecanismes, editeurs).
  // Preconditions : GameApiService et EditorApiService sont disponibles.
  // Postconditions : Les signaux _mechanisms et _editors sont mis a jour.
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

  // Role : Recuperer les donnees du jeu a editer.
  // Preconditions : L'identifiant du jeu est valide.
  // Postconditions : Les signaux _gameTitle et _formData sont mis a jour.
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

  // Role : Mapper les donnees du jeu vers le formulaire.
  // Preconditions : Un objet GameDto est fourni.
  // Postconditions : Le signal _formData est rempli et l'image est reinitialisee.
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

  // Role : Construire l'objet payload a partir des donnees du formulaire.
  // Preconditions : Les donnees du formulaire sont disponibles.
  // Postconditions : Renvoie un GamePayload formate pour l'API.
  private buildPayload(): GamePayload {
    const form = this._formData();
    const toNumber = (value: number | string | null | undefined) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string' && value.trim().length === 0) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

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

  // Role : Verifier la validite du payload avant l'appel API.
  // Preconditions : payload est construit via buildPayload.
  // Postconditions : Retourne la liste des erreurs de validation.
  private getValidationErrors(payload: GamePayload): string[] {
    const errors: string[] = [];

    if (!payload.title) errors.push('Le titre est requis');
    if (!payload.type) errors.push('Le type est requis');
    if (!payload.authors) errors.push('Les auteurs sont requis');
    if (payload.editor_id === null || payload.editor_id === undefined) {
      errors.push("L'éditeur est requis");
    }
    if (payload.min_age === null || payload.min_age === undefined) {
      errors.push("L'âge minimum est requis");
    } else if (payload.min_age < 0) {
      errors.push("L'âge minimum doit être positif");
    }

    if (payload.min_players !== null && payload.min_players !== undefined && payload.min_players < 1) {
      errors.push('Le nombre de joueurs min doit être supérieur ou égal à 1');
    }
    if (payload.max_players !== null && payload.max_players !== undefined && payload.max_players < 1) {
      errors.push('Le nombre de joueurs max doit être supérieur ou égal à 1');
    }
    if (
      payload.min_players !== null &&
      payload.min_players !== undefined &&
      payload.max_players !== null &&
      payload.max_players !== undefined &&
      payload.min_players > payload.max_players
    ) {
      errors.push('Le nombre de joueurs min ne peut pas dépasser le max');
    }

    if (
      payload.duration_minutes !== null &&
      payload.duration_minutes !== undefined &&
      payload.duration_minutes < 0
    ) {
      errors.push('La durée doit être positive');
    }

    return errors;
  }

  // Role : Normaliser les erreurs API pour l'affichage.
  // Preconditions : err est l'erreur renvoyee par HttpClient.
  // Postconditions : Retourne un message utilisateur ou null.
  private extractErrorMessage(err: any): string | null {
    const apiError = err?.error;
    if (typeof apiError === 'string' && apiError.trim().length > 0) {
      return apiError;
    }
    if (apiError) {
      const details = apiError.details;
      if (Array.isArray(details) && details.length > 0) {
        return details.join(' · ');
      }
      if (typeof details === 'string' && details.trim().length > 0) {
        return apiError.error ? `${apiError.error} · ${details}` : details;
      }
      if (typeof apiError.error === 'string' && apiError.error.trim().length > 0) {
        return apiError.error;
      }
    }
    if (typeof err?.message === 'string' && err.message.trim().length > 0) {
      return err.message;
    }
    if (err?.status === 409) {
      return 'Titre déjà utilisé';
    }
    return null;
  }
}
