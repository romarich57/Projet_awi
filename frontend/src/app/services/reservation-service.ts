import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import{ReservationDto} from '../types/reservation-dto';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  
  http = inject(HttpClient);

 
  
}
