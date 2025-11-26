import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { MapService, MapViewDetailsModel, ToolTypeEnum } from '@tailormap-viewer/map';

export const getMapServiceMock = (
  createdTool: ((type: ToolTypeEnum) => any) | null = null,
  projectionCode: string | null = 'EPSG:4326',
  overrides?: Partial<Record<keyof MapService, any>>,
) => {
  const toolManagerMock = {
    enableTool: jest.fn(),
    disableTool: jest.fn(),
    getToolStatusChanged$: jest.fn(() => of({ disabledTools: [], enabledTools: [] })),
    getTool: jest.fn(() => null),
  };
  const mapServiceMock = {
    render: jest.fn(),
    refreshLayer: jest.fn(),
    getRoundedCoordinates$: jest.fn(coords => of(coords)),
    getPixelForCoordinates$: jest.fn((coords: [number, number]) => of(coords)),
    createTool$: jest.fn(({ type }) => {
      // Returns a default tool with common observables if no custom tool is provided
      const defaultTool = {
        id: type,
        drawing$: new Subject().asObservable(),
        selectedFeatures$: new Subject().asObservable(),
        featureModified$: new Subject().asObservable(),
        disableTranslate: jest.fn(),
        enableTranslate: jest.fn(),
        mapClick$: new Subject().asObservable(),
      };
      const tool = createdTool ? createdTool(type) : defaultTool;
      return of({ tool, manager: toolManagerMock });
    }),
    getToolStatusChanged$: jest.fn(() => of({ disabledTools: [], enabledTools: [] })),
    getToolManager$: jest.fn(() => of(toolManagerMock)),
    someToolsEnabled$: jest.fn(() => of(true)),
    enableTool: jest.fn(),
    disableTool: jest.fn(),
    executeToolManagerAction: jest.fn(cb => cb(toolManagerMock)),
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
    switch3D: jest.fn(),
    get3dTerrainOpacity$: jest.fn(() => of(1)),
    ...overrides,
  };
  return {
    provider: { provide: MapService, useValue: mapServiceMock },
    mapService: mapServiceMock,
    toolManager: toolManagerMock,
    createTool$: mapServiceMock.createTool$,
  };
};

export const createMapServiceMockWithDrawingTools = () => {
  const drawingSubject = new BehaviorSubject<{ type: string; geometry?: string }>({ type: 'start' });
  const selectedFeaturesSubject = new Subject();
  const mapServiceMock = getMapServiceMock(type => {
    switch (type) {
      case ToolTypeEnum.Draw:
        return { id: 'draw-1', drawing$: drawingSubject.asObservable() };
      case ToolTypeEnum.Select:
        return { id: 'select-1', selectedFeatures$: selectedFeaturesSubject.asObservable() };
      case ToolTypeEnum.Modify:
        return { id: 'modify-1', featureModified$: new Subject().asObservable() };
      case ToolTypeEnum.ExtTransform:
        return { id: 'ext-transform-1', featureModified$: new Subject().asObservable(), disableTranslate: jest.fn(), enableTranslate: jest.fn() };
      case ToolTypeEnum.MapClick:
        return { id: 'mapclick-1', mapClick$: new Subject().asObservable() };
      default:
        return {};
    }
  });
  return {
    mapService: mapServiceMock.mapService,
    provider: mapServiceMock.provider,
    addDrawingEvent: (event: { type: string; geometry?: string }) => drawingSubject.next(event),
    toolManager: mapServiceMock.toolManager,
    createTool$: mapServiceMock.createTool$,
  };
};

// Dummy test to prevent "Your test suite must contain at least one test." error
describe('AuthenticatedUserTestHelper', () => {
  test('provideAuthenticatedUserServiceWithUser', () => {
    expect(1).toEqual(1);
  });
});
