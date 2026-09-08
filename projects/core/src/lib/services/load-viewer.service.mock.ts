import { getComponentModel, getViewerResponseData, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { of } from 'rxjs';

export const getMockApiService = (overrides?: Partial<TailormapApiV1ServiceModel>) => {
  return {
    getViewer$: (id?: string) => of(getViewerResponseData(id ? { id } : {})),
    getComponents$: () => of([getComponentModel()]),
    ...overrides,
  } as TailormapApiV1ServiceModel;
};
