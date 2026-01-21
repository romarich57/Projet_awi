import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservantDto } from '../../types/reservant-dto';
import { ReservantStore } from '../../stores/reservant.store';
import { GameApiService } from '../../services/game-api';
import { GameCreateStore, GameFormModel, ImageSource } from '../../stores/game-create.store';
import { GameCreateFormComponent } from '../game-create/components/game-create-form/game-create-form';
import { GameImagePreviewComponent } from '../game-create/components/game-image-preview/game-image-preview';
import { GameMechanismsSelectComponent } from '../game-create/components/game-mechanisms-select/game-mechanisms-select';
import type { GameDto } from '../../types/game-dto';
@Component({
  selector: 'app-reservant-card-component',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    GameCreateFormComponent,
    GameImagePreviewComponent,
    GameMechanismsSelectComponent,
  ],
  templateUrl: './reservant-card-component.html',
  styleUrl: './reservant-card-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GameCreateStore],
})
// Role : Afficher les informations d'un reservant et gerer ses actions associees.
// Préconditions : Le reservant est fourni en input ou via l'URL; les stores/services sont disponibles.
// Postconditions : Les donnees sont chargees et les actions (contacts/jeux) sont gerees.
export class ReservantCardComponent {
  readonly reservantStore = inject(ReservantStore);
  private readonly gameApi = inject(GameApiService);
  private readonly gameCreateStore = inject(GameCreateStore);

  readonly reservantInput = input<ReservantDto | null>(null, { alias: 'reservant' });
  readonly reservantIdParam = input<string | null>(null, { alias: 'id' });
  readonly reservantId = computed(() => {
    const idParam = this.reservantIdParam();
    if (!idParam) {
      return null;
    }
    const parsed = Number(idParam);
    return Number.isNaN(parsed) ? null : parsed;
  });

  readonly reservant = computed(() => {
    if (this.reservantInput()) {
      return this.reservantInput();
    }
    const id = this.reservantId();
    if (id === null) {
      return null;
    }
    return this.reservantStore.reservants().find((r) => r.id === id) ?? null;
  });
  readonly contacts = computed(() => this.reservantStore.contacts());
  readonly contactError = this.reservantStore.contactError;
  readonly deletingContactIds = signal<readonly number[]>([]);
  readonly deletingContactIdsSet = computed(() => new Set(this.deletingContactIds()));
  contactForm = {
    name: '',
    email: '',
    phone_number: '',
    job_title: '',
    priority: 0,
  };





  readonly editorGames = signal<GameDto[]>([]);
  readonly editorGamesLoading = signal(false);
  readonly editorGamesError = signal<string | null>(null);

  readonly gameFormData = this.gameCreateStore.formData;
  readonly gameTitleInitial = computed(() => {
    const title = this.gameFormData().title?.trim();
    return title ? title.charAt(0) : '?';
  });
  readonly gameEditors = this.gameCreateStore.editors;
  readonly gameMechanisms = this.gameCreateStore.mechanisms;
  readonly gameSaving = this.gameCreateStore.saving;
  readonly gameError = this.gameCreateStore.error;
  readonly gameImageSource = this.gameCreateStore.imageSource;
  readonly gameImagePreview = this.gameCreateStore.imagePreview;
  readonly gameImageUploadError = this.gameCreateStore.imageUploadError;
  readonly gameIsUploadingImage = this.gameCreateStore.isUploadingImage;

  private gameCreateLoaded = false;
  private lastEditorId: number | null = null;

  constructor() {
    effect(() => {
      const currentId = this.reservantId() ?? this.reservantInput()?.id ?? null;
      if (!this.reservantInput() && currentId !== null) {
        this.reservantStore.loadById(currentId);
      }
      if (currentId !== null) {
        this.reservantStore.loadContacts(currentId);
      }
    });

    effect(() => {
      const reservant = this.reservant();
      if (
        !this.isPageContext ||
        !reservant ||
        reservant.type !== 'editeur' ||
        reservant.editor_id == null
      ) {
        return;
      }

      if (!this.gameCreateLoaded) {
        this.gameCreateStore.loadReferenceData();
        this.gameCreateLoaded = true;
      }

      const editorId = String(reservant.editor_id);
      if (this.gameFormData().editor_id !== editorId) {
        this.gameCreateStore.patchForm({ editor_id: editorId });
      }
    });

    effect(() => {
      const reservant = this.reservant();
      if (
        !this.isPageContext ||
        !reservant ||
        reservant.type !== 'editeur' ||
        reservant.editor_id == null
      ) {
        this.editorGames.set([]);
        this.editorGamesError.set(null);
        this.editorGamesLoading.set(false);
        this.lastEditorId = null;
        return;
      }

      if (this.lastEditorId === reservant.editor_id) {
        return;
      }

      this.lastEditorId = reservant.editor_id;
      this.loadEditorGames(reservant.editor_id);
    });
  }

  get isPageContext(): boolean {
    return this.reservantId() !== null;
  }

  // Role : Obtenir un libelle lisible pour le type de reservant.
  // Préconditions : `type` est une valeur valide du type de reservant.
  // Postconditions : Retourne un libelle en francais.
  typeLabel(type: ReservantDto['type']): string {
    const labels: Record<ReservantDto['type'], string> = {
      editeur: 'Éditeur',
      prestataire: 'Prestataire',
      boutique: 'Boutique',
      animateur: 'Animateur',
      association: 'Association',
    };
    return labels[type];
  }

  // Role : Creer un contact pour le reservant courant.
  // Préconditions : Un reservant courant est disponible.
  // Postconditions : Le contact est cree et le formulaire est reinitialise.
  createContact(): void {
    const reservantId = this.reservant()?.id ?? this.reservantId();
    if (reservantId == null) {
      return;
    }
    const rawPriority = Number(this.contactForm.priority);
    const priority = rawPriority === 1 ? 1 : 0;
    this.reservantStore.createContact(reservantId, {
      ...this.contactForm,
      priority,
    });
    this.contactForm = { name: '', email: '', phone_number: '', job_title: '', priority: 0 };
  }

  // Role : Supprimer un contact existant.
  // Préconditions : contactId et reservantId sont valides.
  // Postconditions : Le contact est supprime de la liste locale.
  deleteContact(contactId: number): void {
    const reservantId = this.reservant()?.id ?? this.reservantId();
    if (reservantId == null || !Number.isFinite(contactId)) {
      return;
    }
    if (this.isDeletingContact(contactId)) {
      return;
    }
    this.setDeletingContact(contactId, true);
    this.reservantStore
      .deleteContact(reservantId, contactId)
      .subscribe({
        error: () => null,
      })
      .add(() => this.setDeletingContact(contactId, false));
  }

  // Role : Verifier si une suppression est en cours pour un contact.
  // Préconditions : contactId est fourni.
  // Postconditions : Retourne true si suppression en cours.
  isDeletingContact(contactId: number): boolean {
    return this.deletingContactIdsSet().has(contactId);
  }

  private setDeletingContact(contactId: number, isDeleting: boolean): void {
    const current = this.deletingContactIds();
    if (isDeleting) {
      if (!current.includes(contactId)) {
        this.deletingContactIds.set([...current, contactId]);
      }
      return;
    }
    if (current.includes(contactId)) {
      this.deletingContactIds.set(current.filter((id) => id !== contactId));
    }
  }

  // Role : Charger la liste des jeux associes a un editeur.
  // Préconditions : `editorId` est un identifiant valide.
  // Postconditions : La liste des jeux est chargee et les etats de chargement sont mis a jour.
  loadEditorGames(editorId: number): void {
    this.editorGamesLoading.set(true);
    this.editorGamesError.set(null);
    this.gameApi.list({ editor_id: editorId }).subscribe({
      next: (games) => this.editorGames.set(games),
      error: (err) => {
        this.editorGamesError.set(err?.message || 'Erreur lors du chargement des jeux');
      },
    }).add(() => this.editorGamesLoading.set(false));
  }

  // Role : Appliquer un patch au formulaire de creation de jeu.
  // Préconditions : `partial` contient des champs valides.
  // Postconditions : Le store de creation est mis a jour.
  onGameFormPatch(partial: Partial<GameFormModel>): void {
    this.gameCreateStore.patchForm(partial);
  }

  // Role : Modifier la source de l'image du jeu.
  // Préconditions : `source` est une valeur valide.
  // Postconditions : Le store enregistre la source selectionnee.
  onGameImageSourceChanged(source: ImageSource): void {
    this.gameCreateStore.setImageSource(source);
  }

  // Role : Recevoir un fichier image choisi pour le jeu.
  // Préconditions : Le fichier peut etre null.
  // Postconditions : Le store stocke le fichier selectionne.
  onGameImageFileSelected(file: File | null): void {
    this.gameCreateStore.selectImageFile(file);
  }

  // Role : Soumettre la creation de jeu pour l'editeur courant.
  // Préconditions : Le formulaire du store est valide.
  // Postconditions : Le jeu est cree et la liste locale est mise a jour.
  onGameSubmit(): void {
    this.gameCreateStore.save().subscribe({
      next: (created) => {
        if (created) {
          this.editorGames.set([created, ...this.editorGames()]);
        }
        this.resetGameForm();
      },
    });
  }

  // Role : Annuler la creation de jeu et reinitialiser le formulaire.
  // Préconditions : Le formulaire de creation est ouvert.
  // Postconditions : Le formulaire est remis a zero.
  onGameCancel(): void {
    this.resetGameForm();
  }

  // Role : Reinitialiser le formulaire de creation de jeu.
  // Préconditions : Le store de creation est disponible.
  // Postconditions : Les champs et la source d'image reviennent aux valeurs par defaut.
  resetGameForm(): void {
    this.gameCreateStore.patchForm({
      title: '',
      type: '',
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
    });
    this.gameCreateStore.setImageSource('url');
  }

  // Role : Normaliser une valeur texte pour l'affichage.
  // Préconditions : `value` peut etre null ou vide.
  // Postconditions : Retourne un texte afficheable.
  displayValue(value?: string | null): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '-';
  }

  // Role : Convertir la priorite numerique en libelle lisible.
  // Préconditions : priority est 0 ou 1.
  // Postconditions : Retourne 'Prioritaire' ou 'Normal'.
  priorityLabel(priority: number): string {
    return priority === 1 ? 'Prioritaire' : 'Normal';
  }
}
