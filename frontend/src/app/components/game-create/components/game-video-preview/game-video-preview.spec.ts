import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameVideoPreviewComponent } from './game-video-preview';

describe('GameVideoPreviewComponent', () => {
  let component: GameVideoPreviewComponent;
  let fixture: ComponentFixture<GameVideoPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameVideoPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameVideoPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returns none when url is empty', () => {
    fixture.componentRef.setInput('videoUrl', '');
    fixture.detectChanges();

    expect(component.preview().kind).toBe('none');
  });

  it('returns embed for youtube url', () => {
    fixture.componentRef.setInput('videoUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    fixture.detectChanges();

    expect(component.preview().kind).toBe('embed');
  });

  it('returns video for direct mp4 url', () => {
    fixture.componentRef.setInput('videoUrl', 'https://example.com/video.mp4');
    fixture.detectChanges();

    const preview = component.preview();
    expect(preview.kind).toBe('video');
    if (preview.kind === 'video') {
      expect(preview.url).toBe('https://example.com/video.mp4');
    }
  });
});
