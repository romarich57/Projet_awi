import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { GamesStore } from './games-store';
import { GameApiService } from '@app/services/game-api';
import { EditorApiService } from '@app/services/editor-api';
import type { GameDto } from '@app/types/game-dto';

describe('GamesStore', () => {
  let store: GamesStore;
  let gameApiSpy: jasmine.SpyObj<GameApiService>;
  let editorApiSpy: jasmine.SpyObj<EditorApiService>;

  const games: GameDto[] = [
    {
      id: 1,
      title: 'Game One',
      type: 'Board',
      editor_id: 2,
      editor_name: 'Editor',
      min_age: 8,
      authors: 'Author',
      min_players: 1,
      max_players: 4,
      prototype: false,
      duration_minutes: 90,
      theme: 'Adventure',
      description: 'A fun adventure game',
      image_url: null,
      rules_video_url: null,
      mechanisms: [],
    },
    {
      id: 2,
      title: 'Game Two',
      type: 'Card',
      editor_id: 3,
      editor_name: 'Editor 2',
      min_age: 10,
      authors: 'Another Author',
      min_players: null,
      max_players: null,
      prototype: true,
      duration_minutes: null,
      theme: 'Strategy',
      description: 'Another description that is quite long and descriptive for testing purposes.',
      image_url: null,
      rules_video_url: null,
      mechanisms: [],
    },
  ];

  beforeEach(() => {
    gameApiSpy = jasmine.createSpyObj('GameApiService', ['list', 'listMechanisms', 'delete']);
    editorApiSpy = jasmine.createSpyObj('EditorApiService', ['list']);

    gameApiSpy.list.and.returnValue(of(games));
    gameApiSpy.listMechanisms.and.returnValue(of([]));
    gameApiSpy.delete.and.returnValue(of(void 0));
    editorApiSpy.list.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        GamesStore,
        { provide: GameApiService, useValue: gameApiSpy },
        { provide: EditorApiService, useValue: editorApiSpy },
      ],
    });

    store = TestBed.inject(GamesStore);
  });

  it('should init and load reference data', () => {
    store.init();

    expect(gameApiSpy.list).toHaveBeenCalled();
    expect(gameApiSpy.listMechanisms).toHaveBeenCalled();
    expect(editorApiSpy.list).toHaveBeenCalled();
    expect(store.games().length).toBe(2);
  });

  it('should expose a friendly error message on conflict during deletion', () => {
    gameApiSpy.delete.and.returnValue(throwError(() => ({ status: 409 } as any)));

    store.deleteGame(games[0]);

    expect(store.deleteError()).toBe('Impossible de supprimer ce jeu car il est utilisé dans une réservation');
  });
});
