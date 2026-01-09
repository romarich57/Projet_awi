import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameImagePreviewComponent } from './game-image-preview';

describe('GameImagePreviewComponent', () => {
  let component: GameImagePreviewComponent;
  let fixture: ComponentFixture<GameImagePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameImagePreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameImagePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
