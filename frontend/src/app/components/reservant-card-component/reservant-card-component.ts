import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
export class ReservantCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly reservantStore = inject(ReservantStore);
  private readonly gameApi = inject(GameApiService);
  private readonly gameCreateStore = inject(GameCreateStore);

  readonly reservantInput = input<ReservantDto | null>(null, { alias: 'reservant' });
  private readonly reservantIdParam = this.route.snapshot.paramMap.get('id');
  readonly reservantId = this.reservantIdParam ? Number(this.reservantIdParam) : null;
  readonly isPageContext = this.reservantId !== null;

  readonly reservant = computed(() => {
    if (this.reservantInput()) {
      return this.reservantInput();
    }
    if (this.reservantId === null) {
      return null;
    }
    return this.reservantStore.reservants().find((r) => r.id === this.reservantId) ?? null;
  });
  readonly contacts = computed(() => this.reservantStore.contacts());
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

  ngOnInit(): void {
    const currentId = this.reservantId ?? this.reservantInput()?.id ?? null;
    if (!this.reservantInput() && currentId !== null) {
      this.reservantStore.loadById(currentId);
    }
    if (currentId !== null) {
      this.reservantStore.loadContacts(currentId);
    }
  }

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

  createContact(): void {
    const reservantId = this.reservant()?.id ?? this.reservantId;
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

  onGameFormPatch(partial: Partial<GameFormModel>): void {
    this.gameCreateStore.patchForm(partial);
  }

  onGameImageSourceChanged(source: ImageSource): void {
    this.gameCreateStore.setImageSource(source);
  }

  onGameImageFileSelected(file: File | null): void {
    this.gameCreateStore.selectImageFile(file);
  }

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

  onGameCancel(): void {
    this.resetGameForm();
  }

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

  displayValue(value?: string | null): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '-';
  }

}
