import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { GameEditPageContainerComponent } from './game-edit-page-container';
import { GameEditStore } from '@app/stores/game-edit-store';
import type { GameFormModel } from '@app/types/game-edit.types';

describe('GameEditPageContainerComponent', () => {
  let component: GameEditPageContainerComponent;
  let fixture: ComponentFixture<GameEditPageContainerComponent>;
  let store: GameEditStore;
  let router: Router;
  let initSpy: jasmine.Spy;
  let saveSpy: jasmine.Spy;
  let setFormDataSpy: jasmine.Spy;

  const routeStub = {
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'id' ? '42' : null),
        has: (key: string) => key === 'id',
        getAll: () => [],
        keys: ['id'],
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameEditPageContainerComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();

    fixture = TestBed.createComponent(GameEditPageContainerComponent);
    component = fixture.componentInstance;

    // Get the actual store from the component's injector
    store = fixture.debugElement.injector.get(GameEditStore);

    // Spy on the store methods
    initSpy = spyOn(store, 'init').and.callThrough();
    saveSpy = spyOn(store, 'save').and.returnValue(of(void 0));
    setFormDataSpy = spyOn(store, 'setFormData').and.callThrough();

    fixture.detectChanges();
  });

  it('should create and initialize the store', () => {
    expect(component).toBeTruthy();
    expect(initSpy).toHaveBeenCalledWith(42);
  });

  it('should navigate back on header or cancel action', () => {
    component.onBackClicked();
    component.onCancelClicked();

    expect(router.navigate).toHaveBeenCalledWith(['/games']);
  });

  it('should submit and navigate on success', () => {
    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith(42);
    expect(router.navigate).toHaveBeenCalledWith(['/games']);
  });

  it('should forward form data changes', () => {
    const next: GameFormModel = {
      title: 'Updated',
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
    };

    component.onFormDataChanged(next);

    expect(setFormDataSpy).toHaveBeenCalledWith(next);
  });
});

