import { Observable, of } from 'rxjs';
import { MapService, MapViewDetailsModel, ToolTypeEnum } from '@tailormap-viewer/map';

export const getMapServiceMock = (
  createdTool: ((type: ToolTypeEnum) => any) | null = null,
  projectionCode: string | null = 'EPSG:4326',
  overrides?: Partial<Record<keyof MapService, any>>,
) => {
  const toolManagerMock = {
    enableTool: jest.fn(),
    disableTool: jest.fn(),
  };
  const mapServiceMock = {
    render: jest.fn(),
    refreshLayer: jest.fn(),
    getRoundedCoordinates$: jest.fn(coords => of(coords)),
    getPixelForCoordinates$: jest.fn((coords: [number, number]) => of(coords)),
    createTool$: jest.fn(({ type }) => {
      const tool = createdTool ? createdTool(type) : { id: type };
      return of({ tool, manager: toolManagerMock });
    }),
    getToolManager$: jest.fn(() => of(toolManagerMock)),
    renderFeatures$: jest.fn(() => of(true)),
    setPadding: jest.fn(() => {}),
    getMapViewDetails$: jest.fn((): Observable<MapViewDetailsModel> => of({
      zoomLevel: 0,
      resolution: 1,
      maxResolution: 100,
      minResolution: 0.001,
      maxZoomLevel: 20,
      minZoomLevel: 0,
      scale: 1000,
      size: undefined,
      extent: null,
      center: undefined,
    })),
    getUnitsOfMeasure$: jest.fn(() => of('degrees')),
    zoomTo: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    zoomToInitialExtent: jest.fn(),
    getProjectionCode$: jest.fn(() => of(projectionCode || 'EPSG:4326')),
    getLayerManager$: jest.fn(() => of({ getLegendUrl: (layerId: string) => `layer-${layerId}-url-from-service` })),
    getLocaleId: jest.fn(() => 'nl'),
    ...overrides,
  };
  return {
    provider: { provide: MapService, useValue: mapServiceMock },
    mapService: mapServiceMock,
    toolManager: toolManagerMock,
    createTool$: mapServiceMock.createTool$,
  };
};

// Dummy test to prevent "Your test suite must contain at least one test." error
describe('AuthenticatedUserTestHelper', () => {
  test('provideAuthenticatedUserServiceWithUser', () => {
    expect(1).toEqual(1);
  });
});
