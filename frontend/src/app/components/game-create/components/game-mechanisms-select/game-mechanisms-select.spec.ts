import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMechanismsSelectComponent } from './game-mechanisms-select';
import type { MechanismDto } from '../../../../types/mechanism-dto';

describe('GameMechanismsSelectComponent', () => {
  let component: GameMechanismsSelectComponent;
  let fixture: ComponentFixture<GameMechanismsSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameMechanismsSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameMechanismsSelectComponent);
    component = fixture.componentInstance;
    const mechanisms: MechanismDto[] = [
      { id: 1, name: 'Draft', description: null },
      { id: 2, name: 'Dice', description: null },
    ];
    fixture.componentRef.setInput('mechanisms', mechanisms);
    fixture.componentRef.setInput('selectedIds', [1]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selectedIdsChange', () => {
    let emitted: number[] | null = null;
    component.selectedIdsChange.subscribe((value) => {
      emitted = value;
    });

    component.toggleMechanism(2);

    expect(emitted).toBeTruthy();
    expect(emitted).toEqual(jasmine.arrayContaining([1, 2]));
  });
});
