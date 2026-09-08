import { describe, beforeEach, test, expect, vi } from 'vitest';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';
import { concatMap, firstValueFrom, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { DescribeAppLayerService } from './describe-app-layer.service';

describe('DescribeAppLayerService', () => {

  let service: DescribeAppLayerService;
  const tailormapServiceMock = {
    getDescribeLayer$: vi.fn((args) => of('describe layer ' + args.layerId + ' for application ' + args.applicationId)),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: tailormapServiceMock },
        DescribeAppLayerService,
      ],
    });
    service = TestBed.inject(DescribeAppLayerService);
  });

  test('get and cache app layer descriptions', async () => {
    const response4 = await firstValueFrom(service.getDescribeAppLayer$('1', '1')
      .pipe(
        concatMap(response => {
          expect(response).toEqual('describe layer 1 for application 1');
          expect(tailormapServiceMock.getDescribeLayer$).toHaveBeenCalledTimes(1);
          return service.getDescribeAppLayer$('1', '1');
        }),
        concatMap(response2 => {
          expect(response2).toEqual('describe layer 1 for application 1');
          // still expect 1 since we are calling with the same props
          expect(tailormapServiceMock.getDescribeLayer$).toHaveBeenCalledTimes(1);
          return service.getDescribeAppLayer$('2', '1');
        }),
        concatMap(response3 => {
          expect(response3).toEqual('describe layer 1 for application 2');
          // expect 2 since we are calling with different props
          expect(tailormapServiceMock.getDescribeLayer$).toHaveBeenCalledTimes(2);
          // old application id again, other layer
          return service.getDescribeAppLayer$('1', '2');
        }),
      ));
    expect(response4).toEqual('describe layer 2 for application 1');
    expect(tailormapServiceMock.getDescribeLayer$).toHaveBeenCalledTimes(3);
  });

});
