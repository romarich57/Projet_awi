import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameListItemComponent } from './game-list-item';
import type { GameDto } from '../../../types/game-dto';
import type { GamesVisibleColumns } from '@app/types/games-page.types';

describe('GameListItemComponent', () => {
  let component: GameListItemComponent;
  let fixture: ComponentFixture<GameListItemComponent>;

  const game: GameDto = {
    id: 1,
    title: 'Game One',
    type: 'Board',
    editor_id: 2,
    editor_name: 'Editor',
    min_age: 8,
    authors: 'Author',
    min_players: 1,
    max_players: 4,
    prototype: false,
    duration_minutes: 90,
    theme: 'Adventure',
    description: 'A fun adventure game',
    image_url: null,
    rules_video_url: null,
    mechanisms: [],
  };

  const columns: GamesVisibleColumns = {
    type: true,
    editor: true,
    age: true,
    players: true,
    authors: true,
    mechanisms: true,
    theme: false,
    duration: false,
    prototype: true,
    description: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameListItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('game', game);
    fixture.componentRef.setInput('visibleColumns', columns);
    fixture.detectChanges();
  });

  it('should format helpers correctly', () => {
    expect(component.playersLabel(game)).toBe('1 - 4');
    expect(component.playersLabel({ ...game, min_players: null, max_players: null })).toBe('—');

    expect(component.ageLabel(game)).toBe('8+');

    expect(component.durationLabel(game)).toBe('');
    fixture.componentRef.setInput('visibleColumns', { ...columns, duration: true });
    fixture.detectChanges();
    expect(component.durationLabel(game)).toBe('90 min');

    expect(component.descriptionSnippet({ ...game, description: 'abc' })).toBe('abc');
    const longDescription = 'a'.repeat(95);
    expect(component.descriptionSnippet({ ...game, description: longDescription })).toContain('…');
  });

  it('should emit view on row click', () => {
    const spy = spyOn(component.view, 'emit');

    component.onRowClick();

    expect(spy).toHaveBeenCalledWith(game);
  });

  it('should emit edit and delete without bubbling', () => {
    const editSpy = spyOn(component.edit, 'emit');
    const deleteSpy = spyOn(component.delete, 'emit');
    const editEvent = new Event('click');
    const deleteEvent = new Event('click');

    component.onEdit(editEvent);
    component.onDelete(deleteEvent);

    expect(editSpy).toHaveBeenCalledWith(game);
    expect(deleteSpy).toHaveBeenCalledWith(game);
  });
});
