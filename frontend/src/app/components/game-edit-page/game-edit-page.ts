import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameApiService, GamePayload } from '../../services/game-api';
import { EditorApiService } from '../../services/editor-api';
import type { MechanismDto } from '../../types/mechanism-dto';
import type { EditorDto } from '../../types/editor-dto';
import type { GameDto } from '../../types/game-dto';

type GameFormModel = {
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

@Component({
  selector: 'app-game-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './game-edit-page.html',
  styleUrl: './game-edit-page.scss',
})
export class GameEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameApi = inject(GameApiService);
  private readonly editorApi = inject(EditorApiService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mechanisms = signal<MechanismDto[]>([]);
  readonly editors = signal<EditorDto[]>([]);
  readonly gameTitle = signal<string>('');

  formData: GameFormModel = {
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

  ngOnInit(): void {
    this.loadReferenceData();
    const idParam = this.route.snapshot.paramMap.get('id');
    const gameId = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(gameId)) {
      this.error.set('Identifiant de jeu invalide');
      return;
    }
    this.fetchGame(gameId);
  }

  private loadReferenceData(): void {
    this.gameApi.listMechanisms().subscribe({
      next: (items) => this.mechanisms.set(items),
      error: (err) => console.error('Erreur chargement mécanismes', err),
    });
    this.editorApi.list().subscribe({
      next: (items) => this.editors.set(items),
      error: (err) => console.error('Erreur chargement éditeurs', err),
    });
  }

  private fetchGame(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.gameApi.get(id).subscribe({
      next: (game) => {
        this.gameTitle.set(game.title);
        this.fillForm(game);
      },
      error: (err) => {
        this.error.set(err.message || 'Jeu introuvable');
      },
    }).add(() => this.loading.set(false));
  }

  private fillForm(game: GameDto): void {
    this.formData = {
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
    };
  }

  private buildPayload(): GamePayload {
    const form = this.formData;
    const toNumber = (value: number | null) =>
      value === null || Number.isNaN(value) ? null : Number(value);

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
      image_url: form.image_url.trim() || undefined,
      rules_video_url: form.rules_video_url.trim() || undefined,
      mechanismIds: form.mechanismIds,
    };
  }

  save(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const gameId = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(gameId)) {
      this.error.set('Identifiant de jeu invalide');
      return;
    }

    const payload = this.buildPayload();
    if (!payload.title || !payload.type || payload.editor_id === null) {
      this.error.set('Merci de remplir les champs requis');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.gameApi.update(gameId, payload).subscribe({
      next: () => this.router.navigate(['/games']),
      error: (err) => this.error.set(err.message || 'Erreur lors de l\'enregistrement'),
    }).add(() => this.saving.set(false));
  }
}
