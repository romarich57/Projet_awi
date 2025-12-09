import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { GameEditPageComponent } from './game-edit-page';
import { GameApiService } from '../../services/game-api';
import { EditorApiService } from '../../services/editor-api';
import type { GameDto } from '../../types/game-dto';

describe('GameEditPageComponent', () => {
  let component: GameEditPageComponent;
  let fixture: ComponentFixture<GameEditPageComponent>;
  let gameApiSpy: jasmine.SpyObj<GameApiService>;
  let editorApiSpy: jasmine.SpyObj<EditorApiService>;
  let router: Router;

  const routeStub = {
    snapshot: {
      paramMap: convertToParamMap({ id: '42' }),
    },
  };

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

  beforeEach(async () => {
    gameApiSpy = jasmine.createSpyObj('GameApiService', ['listMechanisms', 'get', 'update']);
    editorApiSpy = jasmine.createSpyObj('EditorApiService', ['list']);

    gameApiSpy.listMechanisms.and.returnValue(of([]));
    gameApiSpy.get.and.returnValue(of(game));
    gameApiSpy.update.and.returnValue(of(game));
    editorApiSpy.list.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [GameEditPageComponent],
      providers: [
        { provide: GameApiService, useValue: gameApiSpy },
        { provide: EditorApiService, useValue: editorApiSpy },
        { provide: ActivatedRoute, useValue: routeStub },
        provideRouter([]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GameEditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the game', () => {
    expect(component).toBeTruthy();
    expect(gameApiSpy.listMechanisms).toHaveBeenCalled();
    expect(editorApiSpy.list).toHaveBeenCalled();
    expect(gameApiSpy.get).toHaveBeenCalledWith(42);
    expect(component.gameTitle()).toBe(game.title);
    expect(component.formData.title).toBe(game.title);
    expect(component.formData.mechanismIds).toEqual([1]);
  });

  it('should update the game and navigate away on save', () => {
    component.formData = {
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

    component.save();

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
    expect(router.navigate).toHaveBeenCalledWith(['/games']);
    expect(component.saving()).toBeFalse();
  });
});
