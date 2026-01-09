import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameEditHeaderComponent } from './game-edit-header';

describe('GameEditHeaderComponent', () => {
  let component: GameEditHeaderComponent;
  let fixture: ComponentFixture<GameEditHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameEditHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameEditHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('gameTitle', 'Test Game');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit backClicked when clicking back', () => {
    let emitted = false;
    component.backClicked.subscribe(() => {
      emitted = true;
    });

    component.onBack(new Event('click'));

    expect(emitted).toBeTrue();
  });
});
