import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { GameCreatePageContainerComponent } from './game-create-page-container';
import { GameCreateStore, GameFormModel, ImageSource } from '../../../../stores/game-create.store';

class GameCreateStoreStub {
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
  editors = signal([]);
  mechanisms = signal([]);
  saving = signal(false);
  error = signal<string | null>(null);
  imageSource = signal<ImageSource>('url');
  imagePreview = signal('');
  imageUploadError = signal<string | null>(null);
  isUploadingImage = signal(false);

  loadReferenceData = jasmine.createSpy('loadReferenceData');
  patchForm = jasmine.createSpy('patchForm');
  save = jasmine.createSpy('save').and.returnValue(of({} as any));
  setImageSource = jasmine.createSpy('setImageSource');
  selectImageFile = jasmine.createSpy('selectImageFile');
}

describe('GameCreatePageContainerComponent', () => {
  let component: GameCreatePageContainerComponent;
  let fixture: ComponentFixture<GameCreatePageContainerComponent>;
  let store: GameCreateStoreStub;
  let router: Router;

  beforeEach(async () => {
    store = new GameCreateStoreStub();

    await TestBed.configureTestingModule({
      imports: [GameCreatePageContainerComponent],
      providers: [
        { provide: GameCreateStore, useValue: store },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GameCreatePageContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load reference data', () => {
    expect(component).toBeTruthy();
    expect(store.loadReferenceData).toHaveBeenCalled();
  });

  it('should navigate back on header or cancel action', () => {
    component.onBack();
    component.onCancel();

    expect(router.navigate).toHaveBeenCalledWith(['/games']);
  });

  it('should submit and navigate on success', () => {
    component.onSubmit();

    expect(store.save).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/games']);
  });

  it('should forward form patches', () => {
    component.onPatch({ title: 'Updated' });

    expect(store.patchForm).toHaveBeenCalledWith({ title: 'Updated' });
  });
});
