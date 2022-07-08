
import { TestBed } from '@angular/core/testing';
import { MapPdfService } from './map-pdf.service';

describe('MapPdfService', () => {

  let service: MapPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ MapPdfService ],
    });
    service = TestBed.inject(MapPdfService);
  });

  test('should...', () => {
    expect(service).toBeTruthy();
  });

});
