import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCreateHeaderComponent } from './game-create-header';

describe('GameCreateHeaderComponent', () => {
  let component: GameCreateHeaderComponent;
  let fixture: ComponentFixture<GameCreateHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCreateHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCreateHeaderComponent);
    component = fixture.componentInstance;
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
