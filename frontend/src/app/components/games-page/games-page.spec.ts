import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { GamesPageComponent } from './games-page';
import { GameApiService } from '../../services/game-api';
import { EditorApiService } from '../../services/editor-api';
import type { GameDto } from '../../types/game-dto';

describe('GamesPageComponent', () => {
  let component: GamesPageComponent;
  let fixture: ComponentFixture<GamesPageComponent>;
  let gameApiSpy: jasmine.SpyObj<GameApiService>;
  let editorApiSpy: jasmine.SpyObj<EditorApiService>;
  let router: Router;
  let confirmSpy: jasmine.Spy;

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

  beforeEach(async () => {
    gameApiSpy = jasmine.createSpyObj('GameApiService', ['list', 'listMechanisms', 'delete']);
    editorApiSpy = jasmine.createSpyObj('EditorApiService', ['list']);

    gameApiSpy.list.and.returnValue(of(games));
    gameApiSpy.listMechanisms.and.returnValue(of([]));
    gameApiSpy.delete.and.returnValue(of(void 0));
    editorApiSpy.list.and.returnValue(of([]));
    confirmSpy = spyOn(window, 'confirm').and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [GamesPageComponent],
      providers: [
        { provide: GameApiService, useValue: gameApiSpy },
        { provide: EditorApiService, useValue: editorApiSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GamesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load reference data', () => {
    expect(component).toBeTruthy();
    expect(gameApiSpy.list).toHaveBeenCalled();
    expect(gameApiSpy.listMechanisms).toHaveBeenCalled();
    expect(editorApiSpy.list).toHaveBeenCalled();
    expect(component.games().length).toBe(2);
  });

  it('should navigate when creating or editing', () => {
    component.startCreate();
    expect(router.navigate).toHaveBeenCalledWith(['/games', 'new']);

    component.startEdit(games[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/games', games[0].id, 'edit']);
  });

  it('should format helpers correctly', () => {
    expect(component.playersLabel(games[0])).toBe('1 - 4');
    expect(component.playersLabel({ ...games[1], min_players: null, max_players: null })).toBe('—');

    expect(component.ageLabel(games[0])).toBe('8+');

    expect(component.durationLabel(games[0])).toBe('');
    component.visibleColumns['duration'] = true;
    expect(component.durationLabel(games[0])).toBe('90 min');

    expect(component.descriptionSnippet({ ...games[1], description: 'abc' })).toBe('abc');
    const longDescription = 'a'.repeat(95);
    expect(component.descriptionSnippet({ ...games[1], description: longDescription })).toContain('…');
  });

  it('should delete a game when confirmed', () => {
    component.games.set([...games]);

    component.deleteGame(games[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(gameApiSpy.delete).toHaveBeenCalledWith(games[0].id);
    expect(component.games().some((g) => g.id === games[0].id)).toBeFalse();
  });

  it('should expose a friendly error message on conflict during deletion', () => {
    gameApiSpy.delete.and.returnValue(throwError(() => ({ status: 409 } as any)));
    component.games.set([...games]);

    component.deleteGame(games[0]);

    expect(component.deleteError()).toBe('Impossible de supprimer ce jeu car il est utilisé dans une réservation');
  });
});
