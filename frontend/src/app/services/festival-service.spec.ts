import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FestivalService } from '@services/festival-service';
import { FestivalDto } from '../types/festival-dto';
import { ZoneTarifaireDto } from '../types/zone-tarifaire-dto';
import { environment } from '../../environments/environment';

describe('FestivalService', () => {
  let service: FestivalService;
  let httpMock: HttpTestingController;

  const mockFestival: FestivalDto = {
    id: 1,
    name: 'Test Festival',
    start_date: '2024-06-01',
    end_date: '2024-06-30',
    stock_tables_standard: 10,
    stock_tables_grande: 5,
    stock_tables_mairie: 3,
    stock_chaises: 100
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FestivalService]
    });
    service = TestBed.inject(FestivalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CRUD Operations', () => {
    it('should fetch all festivals via GET', () => {
      const mockFestivals = [mockFestival, { ...mockFestival, id: 2 }];
      service.loadAllFestivals();
      const req = httpMock.expectOne(`${environment.apiUrl}/festivals`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFestivals);
      expect(service.festivals().length).toBe(2);
    });

    it('should create festival via POST', (done) => {
      service.addFestival(mockFestival).subscribe(response => {
        expect(response.festival).toBeDefined();
        done();
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/festivals`);
      expect(req.request.method).toBe('POST');
      req.flush({ festival: mockFestival });
      const reloadReq = httpMock.expectOne(`${environment.apiUrl}/festivals`);
      expect(reloadReq.request.method).toBe('GET');
      reloadReq.flush([mockFestival]);
    });

    it('should add zone tarifaire via POST', (done) => {
      service.addZoneTarifaire({ name: 'Zone A' }, 1).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/zones-tarifaires`);
      expect(req.request.body.festival_id).toBe(1);
      req.flush({ zone_tarifaire: {} });
      done();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors on loadAllFestivals', () => {
      spyOn(console, 'error');
      service.loadAllFestivals();
      const req = httpMock.expectOne(`${environment.apiUrl}/festivals`);
      req.error(new ProgressEvent('Network error'));
      expect(console.error).toHaveBeenCalled();
    });
  });
});
