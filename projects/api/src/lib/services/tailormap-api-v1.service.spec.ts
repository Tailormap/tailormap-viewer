import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator/jest';
import { TailormapApiV1Service } from './tailormap-api-v1.service';

describe('TailormapApiV1Service', () => {

  let spectator: SpectatorHttp<TailormapApiV1Service>;
  const createHttp = createHttpFactory(TailormapApiV1Service);

  beforeEach(() => spectator = createHttp());

  test('queries API for getVersion$', () => {
    spectator.service.getVersion$().subscribe();
    spectator.expectOne('/api/version', HttpMethod.GET);
  });

  test('queries API for getApplication$', () => {
    spectator.service.getApplication$({}).subscribe();
    spectator.expectOne('/api/app', HttpMethod.GET);
  });

  test('queries API with app/version for getApplication$', () => {
    spectator.service.getApplication$({ version: 'v1', name: 'test' }).subscribe();
    spectator.expectOne('/api/app?name=test&version=v1', HttpMethod.GET);
  });

  test('queries API with id for getApplication$', () => {
    spectator.service.getApplication$({ id: 123 }).subscribe();
    spectator.expectOne('/api/app?id=123', HttpMethod.GET);
  });

  test('queries API for getMap$', () => {
    spectator.service.getMap$(1).subscribe();
    spectator.expectOne('/api/app/1/map', HttpMethod.GET);
  });

  test('queries API for getComponents$', () => {
    spectator.service.getComponents$(1).subscribe();
    spectator.expectOne('/api/app/1/components', HttpMethod.GET);
  });

  test('queries API for getDescribeLayer$', () => {
    spectator.service.getDescribeLayer$({ applicationId: 1, layerId: 1 }).subscribe();
    spectator.expectOne('/api/app/1/layer/1/describe', HttpMethod.GET);
  });

  test('queries API for getFeatures$', () => {
    spectator.service.getFeatures$({ applicationId: 1, layerId: 1 }).subscribe();
    spectator.expectOne('/api/app/1/layer/1/features', HttpMethod.GET);
  });

  test('queries API for getFeatures$ - with params', () => {
    spectator.service.getFeatures$({ applicationId: 1, layerId: 1, x: 1, y: 2, distance: 10 }).subscribe();
    spectator.expectOne('/api/app/1/layer/1/features?x=1&y=2&distance=10', HttpMethod.GET);
  });

});
