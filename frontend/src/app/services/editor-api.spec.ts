import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EditorApiService } from './editor-api';
import type { EditorDto } from '../types/editor-dto';

describe('EditorApiService', () => {
  let service: EditorApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditorApiService],
    });
    service = TestBed.inject(EditorApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list editors', () => {
    const mockEditors: EditorDto[] = [{ id: 1, name: 'Test', email: 'test@example.com' }];
    service.list().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Test');
    });
    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.endsWith('/editors'));
    req.flush(mockEditors);
  });
});
