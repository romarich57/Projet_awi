import { Component, input } from '@angular/core';
import { ReservantDto } from '../../types/reservant-dto';

@Component({
  selector: 'app-reservant-card-component',
  standalone: true,
  imports: [],
  templateUrl: './reservant-card-component.html',
  styleUrl: './reservant-card-component.scss',
})
export class ReservantCardComponent {

  reservant = input<ReservantDto>();

}
