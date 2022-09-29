import { TestBed } from '@angular/core/testing';
import { UniqueValuesService } from './unique-values.service';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';
import { concatMap, of } from 'rxjs';

describe('UniqueValuesService', () => {

  let service: UniqueValuesService;
  const tailormapServiceMock = {
    getUniqueValues$: jest.fn(() => of({ filterApplied: false, values: [ 'a', 'b', 'c' ] })),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: tailormapServiceMock },
        UniqueValuesService,
      ],
    });
    service = TestBed.inject(UniqueValuesService);
  });

  test('get and cache unique values from api', done => {
    service.getUniqueValues$({ applicationId: 1, layerId: 1, attribute: 'test' })
      .pipe(
        concatMap(response => {
          expect(response).toEqual({ filterApplied: false, values: [ 'a', 'b', 'c' ] });
          expect(tailormapServiceMock.getUniqueValues$).toHaveBeenCalledTimes(1);
          return service.getUniqueValues$({ applicationId: 1, layerId: 1, attribute: 'test' });
        }),
        concatMap(response2 => {
          expect(response2).toEqual({ filterApplied: false, values: [ 'a', 'b', 'c' ] });
          // still expect 1 since we are calling with the same props
          expect(tailormapServiceMock.getUniqueValues$).toHaveBeenCalledTimes(1);
          return service.getUniqueValues$({ applicationId: 2, layerId: 1, attribute: 'test' });
        }),
        concatMap(response3 => {
          expect(response3).toEqual({ filterApplied: false, values: [ 'a', 'b', 'c' ] });
          // expect 2 since we are calling with different props
          expect(tailormapServiceMock.getUniqueValues$).toHaveBeenCalledTimes(2);
          // old application id again
          return service.getUniqueValues$({ applicationId: 1, layerId: 1, attribute: 'test' });
        }),
      )
      .subscribe(response4 => {
        expect(response4).toEqual({ filterApplied: false, values: [ 'a', 'b', 'c' ] });
        // expect 3 since changing the application should have emptied the cache
        expect(tailormapServiceMock.getUniqueValues$).toHaveBeenCalledTimes(3);
        done();
      });
  });

});
