import { Component, input } from '@angular/core';

@Component({
  selector: 'app-workflow-component',
  imports: [],
  templateUrl: './workflow-component.html',
  styleUrl: './workflow-component.scss'
})
export class WorkflowComponent {
  reservationId = input<number | null>(null);
}
