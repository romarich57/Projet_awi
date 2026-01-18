import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { EditorDto } from '../types/editor-dto';

@Injectable({
  providedIn: 'root',
})
export class EditorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/editors`;

  // Role : Recuperer la liste des editeurs.
  // Preconditions : Aucune.
  // Postconditions : Retourne un Observable des editeurs.
  list(): Observable<EditorDto[]> {
    return this.http.get<EditorDto[]>(this.baseUrl);
  }
}
