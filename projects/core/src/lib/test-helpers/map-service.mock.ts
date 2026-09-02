import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { MapService, MapViewDetailsModel, ToolTypeEnum } from '@tailormap-viewer/map';

export const getMapServiceMock = (
  createdTool: ((type: ToolTypeEnum) => any) | null = null,
  projectionCode: string | null = 'EPSG:4326',
  overrides?: Partial<Record<keyof MapService, any>>,
) => {
  const toolManagerMock = {
    enableTool: vi.fn(),
    disableTool: vi.fn(),
    getToolStatusChanged$: vi.fn(() => of({ disabledTools: [], enabledTools: [] })),
    getTool: vi.fn(() => null),
  };
  const mapServiceMock = {
    render: vi.fn(),
    refreshLayer: vi.fn(),
    getRoundedCoordinates$: vi.fn(coords => of(coords)),
    getPixelForCoordinates$: vi.fn((coords: [number, number]) => of(coords)),
    createTool$: vi.fn(({ type }) => {
      // Returns a default tool with common observables if no custom tool is provided
      const defaultTool = {
        id: type,
        drawing$: new Subject().asObservable(),
        selectedFeatures$: new Subject().asObservable(),
        featureModified$: new Subject().asObservable(),
        disableTranslate: vi.fn(),
        enableTranslate: vi.fn(),
        mapClick$: new Subject().asObservable(),
      };
      const tool = createdTool ? createdTool(type) : defaultTool;
      return of({ tool, manager: toolManagerMock });
    }),
    getToolStatusChanged$: vi.fn(() => of({ disabledTools: [], enabledTools: [] })),
    getToolManager$: vi.fn(() => of(toolManagerMock)),
    someToolsEnabled$: vi.fn(() => of(true)),
    enableTool: vi.fn(),
    disableTool: vi.fn(),
    executeToolManagerAction: vi.fn(cb => cb(toolManagerMock)),
    renderFeatures$: vi.fn(() => of(true)),
    setPadding: vi.fn(() => {}),
    getMapViewDetails$: vi.fn((): Observable<MapViewDetailsModel> => of({
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
    getUnitsOfMeasure$: vi.fn(() => of('degrees')),
    zoomTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomToInitialExtent: vi.fn(),
    getProjectionCode$: vi.fn(() => of(projectionCode || 'EPSG:4326')),
    getLayerManager$: vi.fn(() => of({ getLegendUrl: (layerId: string) => `layer-${layerId}-url-from-service` })),
    getPointerDrag$: vi.fn(() => new Subject().asObservable()),
    switch3D: vi.fn(),
    get3dTerrainOpacity$: vi.fn(() => of(1)),
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
        return { id: 'ext-transform-1', featureModified$: new Subject().asObservable(), disableTranslate: vi.fn(), enableTranslate: vi.fn() };
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
