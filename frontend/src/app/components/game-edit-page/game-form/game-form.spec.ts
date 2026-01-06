import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameFormComponent } from './game-form';
import type { GameFormModel } from '@app/types/game-edit.types';

const DEFAULT_FORM: GameFormModel = {
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
};

describe('GameFormComponent', () => {
  let component: GameFormComponent;
  let fixture: ComponentFixture<GameFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formData', DEFAULT_FORM);
    fixture.componentRef.setInput('editors', []);
    fixture.componentRef.setInput('mechanisms', []);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('imageSource', 'url');
    fixture.componentRef.setInput('imagePreview', '');
    fixture.componentRef.setInput('imageUploadError', null);
    fixture.componentRef.setInput('isUploadingImage', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit formDataChanged when updating', () => {
    let emitted: GameFormModel | undefined;
    component.formDataChanged.subscribe((value) => {
      emitted = value;
    });

    component.updateForm({ title: 'Updated' });

    expect(emitted).toBeDefined();
    expect(emitted!.title).toBe('Updated');
  });

  it('should emit submit and cancel events', () => {
    let submitEmitted = false;
    let cancelEmitted = false;

    component.submitClicked.subscribe(() => {
      submitEmitted = true;
    });
    component.cancelClicked.subscribe(() => {
      cancelEmitted = true;
    });

    component.submit();
    component.onCancel(new Event('click'));

    expect(submitEmitted).toBeTrue();
    expect(cancelEmitted).toBeTrue();
  });
});
