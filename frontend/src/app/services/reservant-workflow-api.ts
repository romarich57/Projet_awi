import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ReservantDto, ReservantWorkflowState } from '../types/reservant-dto';
import { Observable } from 'rxjs';
import { ReservantWorkflowFlagsDto } from '../types/reservant-workflow-flags-dto';

@Injectable({
  providedIn: 'root'
})
export class ReservantWorkflowApi {

  private readonly http = inject(HttpClient);
  private readonly resourceUrl = environment.apiUrl + '/reservant';

  updateState(reservantId: number, newState: ReservantWorkflowState, festivalId: number | null = null): Observable<ReservantDto> {
    const url = `${this.resourceUrl}/${reservantId}/workflow`;
    const payload: any = { workflowState: newState };
    if (festivalId !== null) {
      payload.festivalId = festivalId;
    }

    return this.http.patch<ReservantDto>(url, payload, { withCredentials: true });
  }

  updateFlags(reservantId: number, flags: ReservantWorkflowFlagsDto, festivalId: number | null = null): Observable<ReservantDto> {
    const url = `${this.resourceUrl}/${reservantId}/workflow/flags`;
    const payload = festivalId !== null ? { ...flags, festivalId } : flags;
    return this.http.patch<ReservantDto>(url, payload, { withCredentials: true });
  }

}
