import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservantWorkflowApi } from './reservant-workflow-api';
import { environment } from '../../environments/environment';

describe('ReservantWorkflowApi', () => {
  let service: ReservantWorkflowApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservantWorkflowApi]
    });
    service = TestBed.inject(ReservantWorkflowApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update workflow state via PATCH', () => {
    const reservantId = 1;
    const newState = 'Contact_pris';

    service.updateState(reservantId, newState).subscribe(response => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reservant/${reservantId}/workflow`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true });
  });

  it('should construct correct URL for updateState', () => {
    service.updateState(42, 'Discussion_en_cours').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/reservant/42/workflow`);
    expect(req.request.url).toContain('/reservant/42/workflow');
    req.flush({ success: true });
  });

  it('should send correct payload with new state', () => {
    const state = 'Reservation_confirmee';
    service.updateState(1, state).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/reservant/1/workflow`);
    expect(req.request.body).toEqual({ workflowState: state });
    req.flush({ success: true });
  });

  it('should handle workflow API errors', () => {
    service.updateState(1, 'Pas_de_contact' as any).subscribe({
      next: () => fail('Should have failed'),
      error: (error: any) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reservant/1/workflow`);
    req.flush('Invalid state', { status: 400, statusText: 'Bad Request' });
  });

  it('should update workflow flags via PATCH', () => {
    const flags = { liste_jeux_demandee: true, presentera_jeux: false };

    service.updateFlags(7, flags).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/reservant/7/workflow/flags`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(flags);
    req.flush({ success: true });
  });
});
