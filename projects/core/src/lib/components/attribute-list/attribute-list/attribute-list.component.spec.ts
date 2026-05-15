import { render, screen, waitFor } from '@testing-library/angular';
import { getLoadedStoreNoRows, getLoadingStore } from '../state/mocks/attribute-list-state-test-data';
import { provideMockStore } from '@ngrx/store/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeListComponent } from './attribute-list.component';
import { AttributeListState, attributeListStateKey, initialAttributeListState } from '../state/attribute-list.state';
import { initialMapState, MapState, mapStateKey } from '../../../map/state/map.state';
import {
  AttributeType, FeatureModel, FeaturesResponseModel, getAppLayerModel, getLayerTreeNode, TAILORMAP_API_V1_SERVICE,
  TailormapApiConstants,
  TailormapApiV1MockService,
} from '@tailormap-viewer/api';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LoadingStateEnum, PanelResizerComponent, SharedImportsModule } from '@tailormap-viewer/shared';
import { AttributeListContentComponent } from '../attribute-list-content/attribute-list-content.component';
import { AttributeListTableComponent } from '../attribute-list-table/attribute-list-table.component';
import { AttributeListTabToolbarComponent } from '../attribute-list-tab-toolbar/attribute-list-tab-toolbar.component';
import { AttributeListTabComponent } from '../attribute-list-tab/attribute-list-tab.component';
import userEvent from '@testing-library/user-event';
import { Store, StoreModule } from '@ngrx/store';
import { attributeListReducer } from '../state/attribute-list.reducer';
import { mapReducer } from '../../../map/state/map.reducer';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { initialFilterState } from '../../../state/filter-state/filter.state';
import { AttributeListExportButtonComponent } from '../attribute-list-export-button/attribute-list-export-button.component';
import { CoreState, coreStateKey } from '../../../state/core.state';
import { coreReducer } from '../../../state/core.reducer';
import { ExtendedAppLayerModel } from '../../../map/models';
import { CoreSharedModule } from '../../../shared';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { AttributeListSourceModel } from '../models/attribute-list-source.model';
import { Observable, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AttributeListManagerService } from '../services/attribute-list-manager.service';
import { EffectsModule } from '@ngrx/effects';
import { AttributeListEffects } from '../state/attribute-list.effects';
import { AttributeListApiService } from '../services/attribute-list-api.service';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';
import { selectIsLoadingTabs } from '../state/attribute-list.selectors';

type StoreDef = { [mapStateKey]: MapState; [attributeListStateKey]: AttributeListState; [coreStateKey]: CoreState };

const getStore = (
  attributeListStore: { [attributeListStateKey]: AttributeListState },
  layers: ExtendedAppLayerModel[] = [],
): StoreDef => {
  return {
    ...attributeListStore,
    [mapStateKey]: {
      ...initialMapState,
      layers,
      layerTreeNodes: (layers.length > 0 ? [
        getLayerTreeNode({ childrenIds: layers.map(l => `lyr_${l.id}`) }),
        ...layers.map(l => getLayerTreeNode({ id: `lyr_${l.id}`, appLayerId: l.id })),
      ] : []).map(l => ({ ...l, initialChildren: l.childrenIds || [] })),
    },
    [coreStateKey]: {
      loadStatus: LoadingStateEnum.INITIAL,
      filters: initialFilterState,
      viewer: {
        id: 'viewer_1',
        components: [],
      }, // <-- Ensure viewer is always present
    },
  };
};

const setup = async (store: StoreDef) => {
  await render(AttributeListComponent, {
    imports: [ MatProgressSpinnerModule, MatIconModule, MatIconTestingModule, MatToolbarModule, CoreSharedModule ],
    declarations: [ AttributeListComponent, PanelResizerComponent ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      getMapServiceMock().provider,
      provideHttpClientTesting(),
      provideMockStore({
        initialState: store,
      }),
    ],
  });
};

const createDummyFeatures = (
  count: number,
  rowOverride?: (index: number) => Partial<FeatureModel>,
): FeatureModel[] => {
  const rows: FeatureModel[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(createDummyFeature(`${i + 1}`, rowOverride ? rowOverride(i) : undefined));
  }
  return rows;
};

const createDummyFeature = (
  id: string,
  overrides?: Partial<FeatureModel>,
): FeatureModel => ({
  __fid: id,
  attributes: {
    attribute1: id + ': Test',
    attribute2: id + ': Some other value',
    attribute3: id + ': The last value',
  },
  ...(overrides || {}),
});

const setupWithActualState = async (store?: StoreDef) => {
  const initialState = store ? store : getStore(
    { [attributeListStateKey]: { ...initialAttributeListState, visible: true } },
      // : getLoadedStoreWithMultipleTabs(),
    [
      { ...getAppLayerModel({ id: '1', title: 'Layer 1', hasAttributes: true,  visible: true }) },
      { ...getAppLayerModel({ id: '2', title: 'Layer 2', hasAttributes: true,  visible: true }) },
    ],
  );
  const reducers = {
    [attributeListStateKey]: attributeListReducer,
    [mapStateKey]: mapReducer,
    [coreStateKey]: coreReducer,
  };
  const mockService = new TailormapApiV1MockService();
  mockService.getFeatures$ = jest.fn(({ layerId }) => {
    if (layerId === '1') {
      return of({
        features: createDummyFeatures(10),
        columnMetadata: [
          { name: 'attribute1', alias: 'Attribute 1', type: AttributeType.STRING },
          { name: 'attribute2', alias: 'Attribute 2', type: AttributeType.STRING },
          { name: 'attribute3', alias: 'Attribute 3', type: AttributeType.STRING },
        ],
        template: null,
        total: 10,
        page: 0,
        pageSize: 10,
      });
    }
    if (layerId === '2') {
      return of({
        features: createDummyFeatures(10, idx => ({
          attributes: {
            attribute1: (idx + 1) + ': The Netherlands',
            attribute2: (idx + 1) + ': Utrecht',
            attribute3: (idx + 1) + ': Zonnebaan',
          },
        })),
        columnMetadata: [
          { name: 'attribute1', alias: 'Country', type: AttributeType.STRING },
          { name: 'attribute2', alias: 'City', type: AttributeType.STRING },
          { name: 'attribute3', alias: 'Street', type: AttributeType.STRING },
        ],
        template: null,
        total: 10,
        page: 0,
        pageSize: 10,
      });
    }
    return of({
      features: [],
      columnMetadata: [],
      template: null,
      total: 0,
      page: 0,
      pageSize: 0,
    });
  });
  const renderResult = await render(AttributeListComponent, {
    imports: [
      CoreSharedModule,
      SharedImportsModule,
      NoopAnimationsModule,
      MatIconTestingModule,
      StoreModule.forRoot(reducers, { initialState }),
      EffectsModule.forRoot([AttributeListEffects]),
    ],
    providers: [
      provideHttpClient(
        withXsrfConfiguration({
          cookieName: TailormapApiConstants.XSRF_COOKIE_NAME,
          headerName: TailormapApiConstants.XSRF_HEADER_NAME,
        }),
      ),
      { provide: TAILORMAP_API_V1_SERVICE, useValue: mockService },
      AttributeListManagerService,
    ],
    declarations: [
      AttributeListComponent,
      PanelResizerComponent,
      AttributeListContentComponent,
      AttributeListTableComponent,
      AttributeListTabComponent,
      AttributeListTabToolbarComponent,
      AttributeListExportButtonComponent,
    ],
  });
  const apiService = TestBed.inject(AttributeListApiService);
  apiService.initDefaultAttributeListSource();
  return renderResult;
};

describe('AttributeList', () => {

  it('does not render for hidden attribute list', async () => {
    const store = getStore(getLoadingStore({ visible: false }));
    await setup(store);
    expect(await screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('renders without tabs and layers', async () => {
    const store = getStore(getLoadedStoreNoRows({ tabs: [], data: [] }));
    await setup(store);
    expect(await screen.queryByRole('tabpanel')).toBeInTheDocument();
    expect(await screen.getByText('No layers with administrative data found')).toBeInTheDocument();
  });

  it('renders without tabs but with layers', async () => {
    const store = getStore(
      getLoadedStoreNoRows({ tabs: [], data: [] }),
      [getAppLayerModel({ hasAttributes: true, visible: true })],
    );
    await setup(store);
    const managerService = TestBed.inject(AttributeListManagerService);
    const storeService: Store = TestBed.inject(Store);
    managerService.addAttributeListSource({
      id: ATTRIBUTE_LIST_DEFAULT_SOURCE,
      tabs$: of([]),
      // Same as actual service
      isLoadingTabs$: storeService.select(selectIsLoadingTabs),
      dataLoader: {} as any,
    });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  it('renders attribute list with multiple tabs and switches content after clicking tab', async () => {
    await setupWithActualState();
    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
    expect(await screen.findByText('Layer 2')).toBeInTheDocument();
    expect(await screen.findByText('Attribute 1')).toBeInTheDocument();
    expect(await screen.queryByText('City')).not.toBeInTheDocument();
    expect(await screen.findByText('1: Test')).toBeInTheDocument();
    expect(await screen.findByText('10: Test')).toBeInTheDocument();

    const tabEl = await screen.findByText('Layer 2');
    tabEl.style.pointerEvents = 'auto';
    await userEvent.click(tabEl);

    await waitFor(() => {
      expect(screen.queryByText('Attribute 1')).not.toBeInTheDocument();
    }, { timeout: 100 });

    expect(await screen.findByText('Country')).toBeInTheDocument();
    expect(await screen.findByText('City')).toBeInTheDocument();
    expect(await screen.findByText('1: The Netherlands')).toBeInTheDocument();
    expect(await screen.findByText('10: Zonnebaan')).toBeInTheDocument();
  });

  it('renders tabs from other source', async () => {
    await setupWithActualState();
    const source: AttributeListSourceModel = {
      id: 'source_2',
      tabs$: of([{
        id: 'tab_3',
        label: 'Third tab',
        layerId: '3',
      }]),
      dataLoader: {
        getFeatures$: jest.fn((): Observable<FeaturesResponseModel> => {
          return of({
            features: [
              { __fid: '1', attributes: { name: 'Pro', title: 'Tailormap Pro' } },
              { __fid: '2', attributes: { name: 'Core', title: 'Tailormap Core' } },
            ],
            columnMetadata: [
              { name: 'name', alias: 'Name', type: AttributeType.STRING },
              { name: 'title', alias: 'Title', type: AttributeType.STRING },
            ],
            template: null,
            total: null,
            page: null,
            pageSize: null,
          });
        }),
        getLayerExportCapabilities$(): Observable<any> {
          return of({ exportable: false, outputFormats: [] });
        },
        getLayerExport$(): Observable<any> {
          return of(null);
        },
        getUniqueValues$(): Observable<any> {
          return of({ values: [], filterApplied: false });
        },
      },
    };

    const managerService = TestBed.inject(AttributeListManagerService);
    managerService.addAttributeListSource(source);

    expect(await screen.findByText('Layer 1')).toBeInTheDocument();
    expect(await screen.findByText('Layer 2')).toBeInTheDocument();
    expect(await screen.findByText('Third tab')).toBeInTheDocument();

    const tab3El = await screen.findByText('Third tab');
    tab3El.style.pointerEvents = 'auto';
    await userEvent.click(tab3El);

    expect(await screen.findByText('Title')).toBeInTheDocument();
    expect(await screen.findByText('Name')).toBeInTheDocument();
    expect(await screen.findByText('Tailormap Pro')).toBeInTheDocument();
    expect(await screen.findByText('Tailormap Core')).toBeInTheDocument();
  });

});
