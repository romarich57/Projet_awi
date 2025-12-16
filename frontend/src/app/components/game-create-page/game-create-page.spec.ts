import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { GameCreatePageComponent } from './game-create-page';
import { GameApiService } from '../../services/game-api';
import { EditorApiService } from '../../services/editor-api';

describe('GameCreatePageComponent', () => {
  let component: GameCreatePageComponent;
  let fixture: ComponentFixture<GameCreatePageComponent>;
  let gameApiSpy: jasmine.SpyObj<GameApiService>;
  let editorApiSpy: jasmine.SpyObj<EditorApiService>;
  let router: Router;

  beforeEach(async () => {
    gameApiSpy = jasmine.createSpyObj('GameApiService', ['listMechanisms', 'create']);
    editorApiSpy = jasmine.createSpyObj('EditorApiService', ['list']);

    gameApiSpy.listMechanisms.and.returnValue(of([]));
    gameApiSpy.create.and.returnValue(of({} as any));
    editorApiSpy.list.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [GameCreatePageComponent],
      providers: [
        { provide: GameApiService, useValue: gameApiSpy },
        { provide: EditorApiService, useValue: editorApiSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GameCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load mechanisms and editors on init', () => {
    expect(gameApiSpy.listMechanisms).toHaveBeenCalled();
    expect(editorApiSpy.list).toHaveBeenCalled();
  });

  it('should set an error when required fields are missing', () => {
    component.formData = { ...component.formData, title: '', type: '', editor_id: '' };

    component.save();

    expect(component.error()).toBe('Merci de remplir les champs requis');
    expect(gameApiSpy.create).not.toHaveBeenCalled();
  });

  it('should create a game with a trimmed payload and navigate away', () => {
    component.formData = {
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
    };

    component.save();

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
    expect(router.navigate).toHaveBeenCalledWith(['/games']);
    expect(component.saving()).toBeFalse();
  });
});
