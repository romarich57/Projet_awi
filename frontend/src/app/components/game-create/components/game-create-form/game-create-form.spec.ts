import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCreateFormComponent } from './game-create-form';
import type { GameFormModel } from '../../../../stores/game-create.store';

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

describe('GameCreateFormComponent', () => {
  let component: GameCreateFormComponent;
  let fixture: ComponentFixture<GameCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCreateFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCreateFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formData', DEFAULT_FORM);
    fixture.componentRef.setInput('editors', []);
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('imageSource', 'url');
    fixture.componentRef.setInput('imageUploadError', null);
    fixture.componentRef.setInput('isUploadingImage', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit patch when updating', () => {
    let emitted: Partial<GameFormModel> | null = null;
    component.patch.subscribe((value) => {
      emitted = value;
    });

    component.updateForm({ title: 'Updated' });

    expect(emitted).toEqual(jasmine.objectContaining({ title: 'Updated' }));
  });

  it('should emit submit and cancel events', () => {
    let submitEmitted = false;
    let cancelEmitted = false;

    component.submit.subscribe(() => {
      submitEmitted = true;
    });
    component.cancelClicked.subscribe(() => {
      cancelEmitted = true;
    });

    component.submitForm();
    component.onCancel(new Event('click'));

    expect(submitEmitted).toBeTrue();
    expect(cancelEmitted).toBeTrue();
  });
});
