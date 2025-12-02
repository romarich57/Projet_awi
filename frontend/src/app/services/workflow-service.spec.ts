import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WorkflowService } from './workflow-service';
import { environment } from '../../environments/environment';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkflowService]
    });
    service = TestBed.inject(WorkflowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Workflow Operations', () => {
    it('should fetch reservants by festival', () => {
      service.getReservantsByFestival(1).subscribe(reservants => {
        expect(reservants).toEqual([]);
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/workflow/1`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should fetch reservations by festival', () => {
      service.getReservationsByFestival(1).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/workflow/reservations/1`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should create reservation', () => {
      const reservation = { reservant_id: 1, festival_id: 1 };
      service.createReservation(reservation).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/workflow/reservation`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reservation);
      req.flush({ message: 'OK', reservation });
    });

    it('should include withCredentials in all requests', () => {
      service.getReservantsByFestival(1).subscribe();
      const req1 = httpMock.expectOne(`${environment.apiUrl}/workflow/1`);
      expect(req1.request.withCredentials).toBe(true);
      req1.flush([]);

      service.getReservationsByFestival(1).subscribe();
      const req2 = httpMock.expectOne(`${environment.apiUrl}/workflow/reservations/1`);
      expect(req2.request.withCredentials).toBe(true);
      req2.flush([]);
    });
  });
});
