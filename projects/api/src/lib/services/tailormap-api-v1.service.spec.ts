import { TailormapApiV1Service } from './tailormap-api-v1.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

describe('TailormapApiV1Service', () => {

  let service: TailormapApiV1Service;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ TailormapApiV1Service ],
    });
    service = TestBed.inject(TailormapApiV1Service);
    httpController = TestBed.inject(HttpTestingController);
  });

  test('queries API for getVersion$', () => {
    service.getVersion$().subscribe();
    const req = httpController.expectOne({ url: '/api/version', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getApplication$', () => {
    service.getApplication$({}).subscribe();
    const req = httpController.expectOne({ url: '/api/app', method: 'GET' });
    req.flush(null);
  });

  test('queries API with app/version for getApplication$', () => {
    service.getApplication$({ version: 'v1', name: 'test' }).subscribe();
    const req = httpController.expectOne({ url: '/api/app?name=test&version=v1', method: 'GET' });
    req.flush(null);
  });

  test('queries API with id for getApplication$', () => {
    service.getApplication$({ id: 123 }).subscribe();
    const req = httpController.expectOne({ url: '/api/app?id=123', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getMap$', () => {
    service.getMap$(1).subscribe();
    const req = httpController.expectOne({ url: '/api/app/1/map', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getComponents$', () => {
    service.getComponents$(1).subscribe();
    const req = httpController.expectOne({ url: '/api/app/1/components', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getDescribeLayer$', () => {
    service.getDescribeLayer$({ applicationId: 1, layerId: 1 }).subscribe();
    const req = httpController.expectOne({ url: '/api/app/1/layer/1/describe', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getFeatures$', () => {
    service.getFeatures$({ applicationId: 1, layerId: 1 }).subscribe();
    const req = httpController.expectOne({ url: '/api/app/1/layer/1/features', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getFeatures$ - with params', () => {
    service.getFeatures$({ applicationId: 1, layerId: 1, x: 1, y: 2, distance: 10 }).subscribe();
    const req = httpController.expectOne({ url: '/api/app/1/layer/1/features?x=1&y=2&distance=10', method: 'GET' });
    req.flush(null);
  });

});
