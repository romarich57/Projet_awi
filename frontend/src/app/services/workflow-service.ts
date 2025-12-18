import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { WorkflowDto } from '@app/types/workflow-dto';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

    http = inject(HttpClient);


  
  getWorkflowByReservationId(reservationId: number) {
    return this.http.get<WorkflowDto>(`${environment.apiUrl}/workflow/reservation/${reservationId}`,
        { withCredentials: true }
    );
  }

  updateWorkflow(id: number, workflowData: {
    state: string;
    liste_jeux_demandee: boolean;
    liste_jeux_obtenue: boolean;
    jeux_recus: boolean;
    presentera_jeux: boolean;
  }) {
    return this.http.put<WorkflowDto>(`${environment.apiUrl}/workflow/${id}`,
        workflowData,
        { withCredentials: true }
    );
  }



}
