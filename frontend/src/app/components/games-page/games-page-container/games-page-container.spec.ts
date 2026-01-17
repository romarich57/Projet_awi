import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GamesPageContainerComponent } from './games-page-container';
import { GamesStore } from '@app/stores/games-store';
import type { GameDto } from '../../../types/game-dto';
import type { GamesFilters, GamesVisibleColumns } from '@app/types/games-page.types';

class GamesStoreStub {
  games = signal<GameDto[]>([]);
  editors = signal([]);
  loading = signal(false);
  error = signal<string | null>(null);
  deleteError = signal<string | null>(null);
  filters = signal<GamesFilters>({
    title: '',
    type: '',
    editorId: '',
    minAge: '',
  });
  visibleColumns = signal<GamesVisibleColumns>({
    type: true,
    editor: true,
    age: true,
    players: true,
    authors: true,
    mechanisms: true,
    theme: false,
    duration: false,
    prototype: true,
    description: false,
  });
  columnOptions = [
    { key: 'type', label: 'Type' },
    { key: 'editor', label: 'Éditeur' },
  ];
  types = signal<string[]>([]);

  init = jasmine.createSpy('init');
  updateFilters = jasmine.createSpy('updateFilters');
  setVisibleColumns = jasmine.createSpy('setVisibleColumns');
  deleteGame = jasmine.createSpy('deleteGame');
}

describe('GamesPageContainerComponent', () => {
  let component: GamesPageContainerComponent;
  let fixture: ComponentFixture<GamesPageContainerComponent>;
  let store: GamesStoreStub;
  let router: Router;

  const game: GameDto = {
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
  };

  beforeEach(async () => {
    store = new GamesStoreStub();

    await TestBed.configureTestingModule({
      imports: [GamesPageContainerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(GamesPageContainerComponent, {
        set: {
          providers: [{ provide: GamesStore, useValue: store }],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GamesPageContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize the store', () => {
    expect(component).toBeTruthy();
    expect(store.init).toHaveBeenCalled();
  });

  it('should navigate when creating or editing', () => {
    component.startCreate();
    expect(router.navigate).toHaveBeenCalledWith(['/games', 'new']);

    component.onEdit(game);
    expect(router.navigate).toHaveBeenCalledWith(['/games', game.id, 'edit']);
  });

  it('should forward filter and column changes', () => {
    const filters: GamesFilters = {
      title: 'Test',
      type: 'Board',
      editorId: '1',
      minAge: '12',
    };
    const columns: GamesVisibleColumns = {
      type: true,
      editor: true,
      age: false,
      players: true,
      authors: true,
      mechanisms: false,
      theme: false,
      duration: false,
      prototype: true,
      description: false,
    };

    component.onFiltersChanged(filters);
    component.onVisibleColumnsChanged(columns);

    expect(store.updateFilters).toHaveBeenCalledWith(filters);
    expect(store.setVisibleColumns).toHaveBeenCalledWith(columns);
  });

  it('should open the delete confirmation modal', () => {
    component.onDelete(game);

    expect(component.pendingDelete()).toEqual(game);
    expect(component.deletePrompt()).toBe('Supprimer \"Game One\" ?');
  });

  it('should delete a game after confirming', () => {
    component.onDelete(game);

    component.confirmDelete();

    expect(store.deleteGame).toHaveBeenCalledWith(game);
    expect(component.pendingDelete()).toBeNull();
  });

  it('should close the modal when cancelling', () => {
    component.onDelete(game);

    component.cancelDelete();

    expect(component.pendingDelete()).toBeNull();
  });
});
