import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize } from 'rxjs';
import { GameApiService, GamePayload } from '../services/game-api';
import { EditorApiService } from '../services/editor-api';
import { UploadService } from '../services/upload.service';
import { ensureHttpsUrl } from '../shared/utils/https-url';
import type { MechanismDto } from '../types/mechanism-dto';
import type { EditorDto } from '../types/editor-dto';
import type { GameDto } from '../types/game-dto';

export type GameFormModel = {
  title: string;
  type: string;
  editor_id: string;
  min_age: number | null;
  authors: string;
  min_players: number | null;
  max_players: number | null;
  prototype: boolean;
  duration_minutes: number | null;
  theme: string;
  description: string;
  image_url: string;
  rules_video_url: string;
  mechanismIds: number[];
};

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
export class GameCreateStore {
  private readonly gameApi = inject(GameApiService);
  private readonly editorApi = inject(EditorApiService);
  private readonly uploadService = inject(UploadService);

  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mechanisms = signal<MechanismDto[]>([]);
  private readonly _editors = signal<EditorDto[]>([]);
  private readonly _formData = signal<GameFormModel>({ ...DEFAULT_FORM });
  private readonly _imageSource = signal<ImageSource>('url');
  private readonly _imagePreview = signal<string>('');

  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mechanisms = this._mechanisms.asReadonly();
  readonly editors = this._editors.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly imageSource = this._imageSource.asReadonly();
  readonly imagePreview = computed(() => this._imagePreview() || this._formData().image_url);
  readonly isUploadingImage = this.uploadService.isUploading;
  readonly imageUploadError = this.uploadService.uploadError;

  // Role : Charger les donnees de reference necessaires au formulaire (mecanismes, editeurs).
  // Preconditions : Les services GameApiService et EditorApiService doivent etre disponibles.
  // Postconditions : Les signaux _mechanisms et _editors sont mis a jour avec les donnees recues.
  loadReferenceData(): void {
    this.gameApi.listMechanisms().subscribe({
      next: (items) => this._mechanisms.set(items),
      error: (err) => console.error('Erreur chargement mécanismes', err),
    });
    this.editorApi.list().subscribe({
      next: (items) => this._editors.set(items),
      error: (err) => console.error('Erreur chargement éditeurs', err),
    });
  }

  // Role : Mettre a jour les donnees du formulaire sans perdre les mecanismes selectionnes.
  // Preconditions : Un objet partiel conforme au GameFormModel est fourni.
  // Postconditions : Le signal _formData est mis a jour.
  patchForm(partial: Partial<GameFormModel>): void {
    const current = this._formData();
    const mechanismIds = partial.mechanismIds ? [...partial.mechanismIds] : current.mechanismIds;
    this._formData.set({ ...current, ...partial, mechanismIds });
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
        this.patchForm({ image_url: url });
      }
    });
  }

  // Role : Sauvegarder le nouveau jeu en envoyant les donnees au serveur.
  // Preconditions : Le formulaire doit etre valide (titre, type, editeur requis).
  // Postconditions : Si succes, renvoie le jeu cree. Si echec, met a jour le signal d'erreur.
  save(): Observable<GameDto> {
    const payload = this.buildPayload();
    if (!payload.title || !payload.type || payload.editor_id === null) {
      this._error.set('Merci de remplir les champs requis');
      return EMPTY;
    }

    this._saving.set(true);
    this._error.set(null);
    return this.gameApi.create(payload).pipe(
      catchError((err) => {
        this._error.set(err.message || 'Erreur lors de la création');
        return EMPTY;
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  // Role : Construire l'objet payload a envoyer a l'API a partir des donnees du formulaire.
  // Preconditions : Aucune.
  // Postconditions : Renvoie un objet GamePayload formate et nettoye (trim, conversions).
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
