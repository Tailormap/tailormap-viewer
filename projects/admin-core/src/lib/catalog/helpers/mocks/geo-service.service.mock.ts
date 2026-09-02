import { of } from 'rxjs';
import { GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';

export const createGeoServiceMock = (geoServiceModelMock?: GeoServiceWithLayersModel) => {
  const updateGeoServiceDetails = vi.fn((_details) => ({}));
  const updateGeoServiceSettings = vi.fn((_settings) => ({}));
  const geoServiceService = {
    getDraftGeoService$: vi.fn(() => of(geoServiceModelMock)),
    createGeoService$: vi.fn(() => of(true)),
    updateGeoService$: vi.fn((id, serviceCallback, settingsCallback) => {
      const result = serviceCallback(geoServiceModelMock || {});
      updateGeoServiceDetails(result);
      let settings = geoServiceModelMock?.settings || {};
      if (settingsCallback) {
        settings = settingsCallback(geoServiceModelMock?.settings || {});
        updateGeoServiceSettings(settings);
      }
      return of({
        ...(geoServiceModelMock || {}),
        ...result,
        settings,
      });
    }),
    refreshGeoService$: vi.fn((geoServiceId: string) => {
      return of(geoServiceModelMock || {});
    }),
  };
  return {
    geoServiceService,
    createGeoService$: geoServiceService.createGeoService$,
    updateGeoService$: geoServiceService.updateGeoService$,
    refreshGeoService$: geoServiceService.refreshGeoService$,
    updateGeoServiceDetails,
    updateGeoServiceSettings,
  };
};
