import { describe, test, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { DescribeAppLayerService, TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { getFilterGroup } from '@tailormap-viewer/shared';
import { DefaultDataSourceApiService } from './default-data-source-api.service';

const setup = () => {
  const api = { getFeatures$: vi.fn(() => of({ features: [], columnMetadata: [], template: null, total: 0, page: 1, pageSize: 10 })) };
  const describeLayerService = { getDescribeAppLayer$: vi.fn(() => of({ geometryAttribute: 'geom' })) };
  TestBed.configureTestingModule({
    providers: [
      provideMockStore(),
      { provide: TAILORMAP_API_V1_SERVICE, useValue: api },
      { provide: DescribeAppLayerService, useValue: describeLayerService },
    ],
  });
  return { service: TestBed.inject(DefaultDataSourceApiService), api, describeLayerService };
};

describe('DefaultDataSourceApiService', () => {

  test('converts filter groups to CQL for the layer', async () => {
    const { service, api, describeLayerService } = setup();
    await firstValueFrom(service.getFeatures$({ applicationId: 'app', layerId: '1', layerName: 'layer1', filterGroups: [getFilterGroup()] }));
    expect(describeLayerService.getDescribeAppLayer$).not.toHaveBeenCalled();
    expect(api.getFeatures$).toHaveBeenCalledWith({ applicationId: 'app', layerId: '1', layerName: 'layer1', filter: "(attribute ILIKE '%value%')" });
  });

  test('adds a BBOX on the geometry attribute when bbox is set', async () => {
    const { service, api } = setup();
    await firstValueFrom(service.getFeatures$({
      applicationId: 'app', layerId: '1', layerName: 'layer1', filterGroups: [getFilterGroup()], bbox: [ 0, 1, 2, 3 ],
    }));
    expect(api.getFeatures$).toHaveBeenCalledWith(expect.objectContaining({
      filter: "((attribute ILIKE '%value%')) AND (BBOX(geom, 0,1,2,3))",
    }));
    expect(api.getFeatures$.mock.calls[0]).not.toHaveProperty('0.bbox');
  });

});
