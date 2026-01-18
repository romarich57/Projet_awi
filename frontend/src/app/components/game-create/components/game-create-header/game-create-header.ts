import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-game-create-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-create-header.html',
  styleUrl: './game-create-header.scss',
})
// Role : Afficher l'entete de creation de jeu et gerer le retour.
// Préconditions : Le parent ecoute l'evenement `backClicked`.
// Postconditions : Un clic sur retour emet l'evenement.
export class GameCreateHeaderComponent {
  readonly backClicked = output<void>();

  // Role : Intercepter le clic retour et emettre un evenement.
  // Préconditions : L'evenement provient du lien/bouton retour.
  // Postconditions : `backClicked` est emis et l'action par defaut est annulee.
  onBack(event: Event): void {
    event.preventDefault();
    this.backClicked.emit();
  }
}
