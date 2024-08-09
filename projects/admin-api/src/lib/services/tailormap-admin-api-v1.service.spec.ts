import { TailormapAdminApiV1Service } from './tailormap-admin-api-v1.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { TailormapApiConstants } from '@tailormap-viewer/api';

describe('TailormapAdminApiV1Service', () => {

  let service: TailormapAdminApiV1Service;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
            headerName: TailormapApiConstants.XSRF_HEADER_NAME,
          }),
        ),
        provideHttpClientTesting(),
        TailormapAdminApiV1Service,
      ],
    });
    service = TestBed.inject(TailormapAdminApiV1Service);
    httpController = TestBed.inject(HttpTestingController);
  });

  test('queries API for getCatalog$', () => {
    service.getCatalog$().subscribe();
    const req = httpController.expectOne({ url: '/api/admin/catalogs/main', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getGeoService$', () => {
    service.getGeoService$({ id: '1' }).subscribe();
    const req = httpController.expectOne({ url: '/api/admin/geo-services/1', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getUsers$', () => {
    service.getUsers$().subscribe();
    const req = httpController.expectOne({ url: '/api/admin/users?size=1000&sort=username', method: 'GET' });
    req.flush(null);
  });

  test('queries API for getGroups$', () => {
    service.getGroups$().subscribe();
    const req = httpController.expectOne({ url: '/api/admin/groups?size=1000&sort=name', method: 'GET' });
    req.flush(null);
  });

});
