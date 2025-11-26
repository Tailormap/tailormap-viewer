import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrintComponent } from './print.component';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { PrintService } from '../print.service';
import { ApplicationMapService } from '../../../map/services/application-map.service';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';

describe('PrintComponent', () => {
  let component: PrintComponent;
  let fixture: ComponentFixture<PrintComponent>;

  // Mock initial state with required properties
  const initialState = {
    map: {
      layers: [],
      services: [],
      selectedLayer: undefined,
      mapSettings: {},
      layerTreeNodes: [],
      baseLayerTreeNodes: [],
      selectedBackgroundNode: undefined,
      terrainLayerTreeNodes: [],
      selectedTerrainLayerNode: undefined,
      loadStatus: {},
      layerDetails: [],
      in3dView: false,
    },
    drawing: {
      features: [],
      selectedFeature: undefined,
      selectedDrawingType: undefined,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrintComponent],
      providers: [
        provideMockStore({ initialState }),
        { provide: MenubarService, useValue: { isComponentVisible$: () => of(false), registerComponent: () => {}, deregisterComponent: () => {} } },
        { provide: PrintService, useValue: { cancel: () => {}, getMapExtent$: () => of(null), downloadPdf$: () => of(null), downloadMapImage$: () => of(null) } },
        { provide: ApplicationMapService, useValue: { selectOrderedVisibleLayersWithFilters$: () => of([]) } },
        { provide: MapService, useValue: { renderFeatures$: () => of(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render', () => {
    expect(component).toBeTruthy();
  });
});
