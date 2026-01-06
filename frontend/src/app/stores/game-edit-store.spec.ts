import { signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { GameEditStore } from './game-edit-store';
import { GameApiService } from '@app/services/game-api';
import { EditorApiService } from '@app/services/editor-api';
import { UploadService } from '@app/services/upload.service';
import type { GameDto } from '@app/types/game-dto';
import type { GameFormModel } from '@app/types/game-edit.types';

describe('GameEditStore', () => {
  let store: GameEditStore;
  let gameApiSpy: jasmine.SpyObj<GameApiService>;
  let editorApiSpy: jasmine.SpyObj<EditorApiService>;
  let uploadServiceMock: { isUploading: any; uploadError: any; uploadGameImage: jasmine.Spy };

  const game: GameDto = {
    id: 42,
    title: 'Existing Game',
    type: 'Board',
    editor_id: 3,
    editor_name: 'Cool Editor',
    min_age: 10,
    authors: 'John Doe',
    min_players: 2,
    max_players: 5,
    prototype: false,
    duration_minutes: 45,
    theme: 'Strategy',
    description: 'A long description',
    image_url: null,
    rules_video_url: null,
    mechanisms: [{ id: 1, name: 'Draft', description: null }],
  };

  beforeEach(() => {
    gameApiSpy = jasmine.createSpyObj('GameApiService', ['listMechanisms', 'get', 'update']);
    editorApiSpy = jasmine.createSpyObj('EditorApiService', ['list']);

    gameApiSpy.listMechanisms.and.returnValue(of([]));
    gameApiSpy.get.and.returnValue(of(game));
    gameApiSpy.update.and.returnValue(of(game));
    editorApiSpy.list.and.returnValue(of([]));
    uploadServiceMock = {
      isUploading: signal(false),
      uploadError: signal<string | null>(null),
      uploadGameImage: jasmine.createSpy('uploadGameImage').and.returnValue(of('/uploads/games/test.png')),
    };

    TestBed.configureTestingModule({
      providers: [
        GameEditStore,
        { provide: GameApiService, useValue: gameApiSpy },
        { provide: EditorApiService, useValue: editorApiSpy },
        { provide: UploadService, useValue: uploadServiceMock },
      ],
    });

    store = TestBed.inject(GameEditStore);
  });

  it('should init and load the game', fakeAsync(() => {
    store.init(42);
    tick();

    expect(gameApiSpy.listMechanisms).toHaveBeenCalled();
    expect(editorApiSpy.list).toHaveBeenCalled();
    expect(gameApiSpy.get).toHaveBeenCalledWith(42);
    expect(store.gameTitle()).toBe(game.title);
    expect(store.formData().title).toBe(game.title);
    expect(store.formData().mechanismIds).toEqual([1]);
  }));

  it('should update the game with trimmed payload', fakeAsync(() => {
    const form: GameFormModel = {
      title: ' Updated ',
      type: ' Card ',
      editor_id: '7',
      min_age: 8,
      authors: ' Jane ',
      min_players: 1,
      max_players: 4,
      prototype: true,
      duration_minutes: 30,
      theme: ' Theme ',
      description: ' Description ',
      image_url: ' https://image ',
      rules_video_url: ' https://video ',
      mechanismIds: [2, 3],
    };

    store.setFormData(form);
    store.save(42).subscribe();
    tick();

    expect(gameApiSpy.update).toHaveBeenCalledWith(42, {
      title: 'Updated',
      type: 'Card',
      editor_id: 7,
      min_age: 8,
      authors: 'Jane',
      min_players: 1,
      max_players: 4,
      prototype: true,
      duration_minutes: 30,
      theme: 'Theme',
      description: 'Description',
      image_url: 'https://image',
      rules_video_url: 'https://video',
      mechanismIds: [2, 3],
    });
  }));
});
