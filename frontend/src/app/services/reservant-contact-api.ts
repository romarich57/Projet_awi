import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ReservantContactDto } from '../types/reservant-contact-dto';
import { ContactDto } from '../types/contact-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservantContactApi {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/reservant';

  listContacts(reservantId: number): Observable<ContactDto[]> {
    return this.http.get<ContactDto[]>(`${this.baseUrl}/${reservantId}/contacts`, { withCredentials: true });
  }

  listTimeline(reservantId: number): Observable<ReservantContactDto[]> {
    return this.http.get<ReservantContactDto[]>(`${this.baseUrl}/${reservantId}/contacts/timeline`, { withCredentials: true });
  }

  addContact(reservantId: number, contact: ContactDto): Observable<ContactDto> {
    return this.http.post<ContactDto>(`${this.baseUrl}/${reservantId}/contacts`, contact, { withCredentials: true });
  }

  addContactEvent(reservantId: number, contactId: number, dateContact: string): Observable<ReservantContactDto> {
    const payload = { contactId, dateContact };
    return this.http.post<ReservantContactDto>(`${this.baseUrl}/${reservantId}/contacts/events`, payload, { withCredentials: true });
  }

  deleteContact(reservantId: number, contactId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${reservantId}/contacts/${contactId}`, { withCredentials: true });
  }

  deleteContactEvent(reservantId: number, eventId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${reservantId}/contacts/events/${eventId}`, { withCredentials: true });
  }
}
