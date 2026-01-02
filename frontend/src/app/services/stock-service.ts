import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, shareReplay } from 'rxjs';

export interface TableStock {
  type: 'standard' | 'grande' | 'mairie';
  total: number;
  reserved: number;
  available: number;
}

export interface ChairStock {
  total: number;
  reserved: number;
  available: number;
}

export interface StockData {
  tables: TableStock[];
  chairs: ChairStock;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  constructor(private http: HttpClient) {}

//   getStock(festivalId: number): Observable<any> { // <-- Change StockData en any
//   const url = `/api/stock/${festivalId}`;
//   console.log(`🔗 [StockService] GET ${url}`);
  
//   return this.http.get<any>(url); // <-- any aussi ici
// }
  getStock(festivalId: number): Observable<any> {
  // FAIS EXACTEMENT COMME getFestivals()
  return this.http.get<any>(`/api/stock/${festivalId}`, {
    // Ajoute les mêmes options que getFestivals() si nécessaire
  });
}
}