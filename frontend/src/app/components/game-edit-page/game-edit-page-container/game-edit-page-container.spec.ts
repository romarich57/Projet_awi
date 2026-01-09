import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { GameEditPageContainerComponent } from './game-edit-page-container';
import { GameEditStore, ImageSource } from '@app/stores/game-edit-store';
import type { GameFormModel } from '@app/types/game-edit.types';

class GameEditStoreStub {
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  mechanisms = signal([]);
  editors = signal([]);
  gameTitle = signal('Existing Game');
  imageSource = signal<ImageSource>('url');
  imagePreview = signal('');
  imageUploadError = signal<string | null>(null);
  isUploadingImage = signal(false);
  formData = signal<GameFormModel>({
    title: 'Existing',
    type: 'Board',
    editor_id: '1',
    min_age: 8,
    authors: 'Author',
    min_players: 2,
    max_players: 4,
    prototype: false,
    duration_minutes: 30,
    theme: 'Theme',
    description: 'Description',
    image_url: '',
    rules_video_url: '',
    mechanismIds: [],
  });

  init = jasmine.createSpy('init');
  setFormData = jasmine.createSpy('setFormData');
  save = jasmine.createSpy('save').and.returnValue(of(void 0));
  setImageSource = jasmine.createSpy('setImageSource');
  selectImageFile = jasmine.createSpy('selectImageFile');
}

describe('GameEditPageContainerComponent', () => {
  let component: GameEditPageContainerComponent;
  let fixture: ComponentFixture<GameEditPageContainerComponent>;
  let store: GameEditStoreStub;
  let router: Router;

  const routeStub = {
    snapshot: {
      paramMap: convertToParamMap({ id: '42' }),
    },
  };

  beforeEach(async () => {
    store = new GameEditStoreStub();

    await TestBed.configureTestingModule({
      imports: [GameEditPageContainerComponent],
      providers: [
        { provide: GameEditStore, useValue: store },
        { provide: ActivatedRoute, useValue: routeStub },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GameEditPageContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize the store', () => {
    expect(component).toBeTruthy();
    expect(store.init).toHaveBeenCalledWith(42);
  });

  it('should navigate back on header or cancel action', () => {
    component.onBackClicked();
    component.onCancelClicked();

    expect(router.navigate).toHaveBeenCalledWith(['/games']);
  });

  it('should submit and navigate on success', () => {
    component.onSubmit();

    expect(store.save).toHaveBeenCalledWith(42);
    expect(router.navigate).toHaveBeenCalledWith(['/games']);
  });

  it('should forward form data changes', () => {
    const next: GameFormModel = {
      ...store.formData(),
      title: 'Updated',
    };

    component.onFormDataChanged(next);

    expect(store.setFormData).toHaveBeenCalledWith(next);
  });
});
