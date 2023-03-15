import { of } from 'rxjs';

export const createGeoServiceMock = () => {
  const updateGeoServiceDetails = jest.fn((_details) => ({}));
  const updateGeoServiceSettings = jest.fn((_settings) => ({}));
  const geoServiceService = {
    createGeoService$: jest.fn(() => of(true)),
    updateGeoService$: jest.fn((id, serviceCallback, settingsCallback) => {
      const result = serviceCallback({});
      updateGeoServiceDetails(result);
      if (settingsCallback) {
        const result2 = settingsCallback({});
        updateGeoServiceSettings(result2);
      }
      return of(true);
    }),
  };
  return {
    geoServiceService,
    createGeoService$: geoServiceService.createGeoService$,
    updateGeoService$: geoServiceService.updateGeoService$,
    updateGeoServiceDetails,
    updateGeoServiceSettings,
  };
};
