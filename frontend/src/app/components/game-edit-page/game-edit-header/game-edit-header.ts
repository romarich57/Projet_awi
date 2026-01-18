import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-game-edit-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-edit-header.html',
  styleUrl: './game-edit-header.scss',
})
// Role : Afficher l'entete d'edition d'un jeu et gerer le retour.
// Préconditions : Le parent fournit `gameTitle` et ecoute `backClicked`.
// Postconditions : L'entete est rendu et le retour est emet.
export class GameEditHeaderComponent {
  readonly gameTitle = input<string>('');
  readonly backClicked = output<void>();

  // Role : Intercepter le clic retour et emettre l'evenement.
  // Préconditions : L'evenement provient du lien/bouton retour.
  // Postconditions : `backClicked` est emis et l'action par defaut est annulee.
  onBack(event: Event): void {
    event.preventDefault();
    this.backClicked.emit();
  }
}
