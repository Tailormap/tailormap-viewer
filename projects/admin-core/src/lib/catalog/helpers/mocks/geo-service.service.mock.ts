import { of } from 'rxjs';
import { GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';

export const createGeoServiceMock = (geoServiceModelMock?: GeoServiceWithLayersModel) => {
  const updateGeoServiceDetails = jest.fn((_details) => ({}));
  const updateGeoServiceSettings = jest.fn((_settings) => ({}));
  const geoServiceService = {
    getDraftGeoService$: jest.fn(() => of(geoServiceModelMock)),
    createGeoService$: jest.fn(() => of(true)),
    updateGeoService$: jest.fn((id, serviceCallback, settingsCallback) => {
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
    refreshGeoService$: jest.fn((geoServiceId: string) => {
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
