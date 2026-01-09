import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GameCreateStore } from './game-create.store';
import { GameApiService } from '../services/game-api';
import { EditorApiService } from '../services/editor-api';
import { UploadService } from '../services/upload.service';

describe('GameCreateStore', () => {
  let store: GameCreateStore;
  let gameApiSpy: jasmine.SpyObj<GameApiService>;
  let editorApiSpy: jasmine.SpyObj<EditorApiService>;
  let uploadServiceMock: { isUploading: any; uploadError: any; uploadGameImage: jasmine.Spy };

  beforeEach(() => {
    gameApiSpy = jasmine.createSpyObj('GameApiService', ['listMechanisms', 'create']);
    editorApiSpy = jasmine.createSpyObj('EditorApiService', ['list']);

    gameApiSpy.listMechanisms.and.returnValue(of([]));
    gameApiSpy.create.and.returnValue(of({} as any));
    editorApiSpy.list.and.returnValue(of([]));
    uploadServiceMock = {
      isUploading: signal(false),
      uploadError: signal<string | null>(null),
      uploadGameImage: jasmine.createSpy('uploadGameImage').and.returnValue(of('/uploads/games/test.png')),
    };

    TestBed.configureTestingModule({
      providers: [
        GameCreateStore,
        { provide: GameApiService, useValue: gameApiSpy },
        { provide: EditorApiService, useValue: editorApiSpy },
        { provide: UploadService, useValue: uploadServiceMock },
      ],
    });

    store = TestBed.inject(GameCreateStore);
  });

  it('should load mechanisms and editors', () => {
    store.loadReferenceData();

    expect(gameApiSpy.listMechanisms).toHaveBeenCalled();
    expect(editorApiSpy.list).toHaveBeenCalled();
  });

  it('should set an error when required fields are missing', () => {
    store.patchForm({ title: '', type: '', editor_id: '' });

    store.save();

    expect(store.error()).toBe('Merci de remplir les champs requis');
    expect(gameApiSpy.create).not.toHaveBeenCalled();
  });

  it('should create a game with a trimmed payload', () => {
    store.patchForm({
      title: '  My Game ',
      type: ' Card ',
      editor_id: '5',
      min_age: 12,
      authors: ' Jane Doe ',
      min_players: 2,
      max_players: 4,
      prototype: true,
      duration_minutes: 60,
      theme: ' Theme ',
      description: ' Description ',
      image_url: ' https://img ',
      rules_video_url: ' https://video ',
      mechanismIds: [1, 2],
    });

    store.save().subscribe();

    expect(gameApiSpy.create).toHaveBeenCalledWith({
      title: 'My Game',
      type: 'Card',
      editor_id: 5,
      min_age: 12,
      authors: 'Jane Doe',
      min_players: 2,
      max_players: 4,
      prototype: true,
      duration_minutes: 60,
      theme: 'Theme',
      description: 'Description',
      image_url: 'https://img',
      rules_video_url: 'https://video',
      mechanismIds: [1, 2],
    });
    expect(store.saving()).toBeFalse();
  });
});
