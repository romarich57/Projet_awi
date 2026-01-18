import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FestivalListComponent } from '@app/components/festival-list-component/festival-list-component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FestivalListComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
// Role : Afficher la page d'accueil et la liste des festivals.
// Préconditions : Les composants enfants sont importes.
// Postconditions : L'interface d'accueil est rendue.
export class HomeComponent {
}
