import { render, screen, waitFor } from '@testing-library/angular';
import { getLoadedStoreNoRows, getLoadedStoreWithMultipleTabs, getLoadingStore } from '../state/mocks/attribute-list-state-test-data';
import { provideMockStore } from '@ngrx/store/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeListComponent } from './attribute-list.component';
import { AttributeListState, attributeListStateKey } from '../state/attribute-list.state';
import { initialMapState, mapStateKey } from '../../../map/state/map.state';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PanelResizerComponent, SharedImportsModule } from '@tailormap-viewer/shared';
import { AttributeListContentComponent } from '../attribute-list-content/attribute-list-content.component';
import { AttributeListTableComponent } from '../attribute-list-table/attribute-list-table.component';
import { AttributeListTabToolbarComponent } from '../attribute-list-tab-toolbar/attribute-list-tab-toolbar.component';
import { AttributeListTabComponent } from '../attribute-list-tab/attribute-list-tab.component';
import userEvent from '@testing-library/user-event';
import { StoreModule } from '@ngrx/store';
import { attributeListReducer } from '../state/attribute-list.reducer';
import { mapReducer } from '../../../map/state/map.reducer';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { filterStateKey, initialFilterState } from '../../../filter/state/filter.state';
import { filterReducer } from '../../../filter/state/filter.reducer';

const getStore = (
  attributeListStore: { [attributeListStateKey]: AttributeListState },
  layers: AppLayerModel[] = [],
) => {
  return {
    ...attributeListStore,
    [mapStateKey]: {
      ...initialMapState,
      layers,
    },
    [filterStateKey]: {
      ...initialFilterState,
    },
  };
};

describe('AttributeList', () => {

  it('does not render for hidden attribute list', async () => {
    const store = getStore(getLoadingStore({ visible: false }));
    await render(AttributeListComponent, {
      imports: [ MatIconModule, MatIconTestingModule, MatToolbarModule ],
      declarations: [ AttributeListComponent, PanelResizerComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('renders without tabs and layers', async () => {
    const store = getStore(getLoadedStoreNoRows({ tabs: [], data: [] }));
    await render(AttributeListComponent, {
      imports: [ MatIconModule, MatIconTestingModule, MatToolbarModule ],
      declarations: [ AttributeListComponent, PanelResizerComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.queryByRole('tabpanel')).toBeInTheDocument();
    expect(await screen.getByText('No layers with administrative data found')).toBeInTheDocument();
  });

  it('renders without tabs but with layers', async () => {
    const store = getStore(
      getLoadedStoreNoRows({ tabs: [], data: [] }),
      [
        getAppLayerModel({
          hasAttributes: true,
          visible: true,
        }),
      ],
    );
    await render(AttributeListComponent, {
      imports: [ MatProgressSpinnerModule, MatIconModule, MatIconTestingModule, MatToolbarModule ],
      declarations: [ AttributeListComponent, PanelResizerComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.queryByRole('progressbar')).toBeInTheDocument();
  });

  it('renders attribute list with multiple tabs and switches content after clicking tab', async () => {
    const store = getStore(
      getLoadedStoreWithMultipleTabs(),
      [
        getAppLayerModel({ id: 1,  hasAttributes: true,  visible: true }),
        getAppLayerModel({ id: 2,  hasAttributes: true,  visible: true }),
      ],
    );
    await render(AttributeListComponent, {
      imports: [
        SharedImportsModule,
        NoopAnimationsModule,
        MatIconTestingModule,
        StoreModule.forRoot({
          [attributeListStateKey]: attributeListReducer,
          [mapStateKey]: mapReducer,
          [filterStateKey]: filterReducer,
        }, { initialState: store }),
      ],
      declarations: [
        AttributeListComponent,
        PanelResizerComponent,
        AttributeListContentComponent,
        AttributeListTableComponent,
        AttributeListTabComponent,
        AttributeListTabToolbarComponent,
      ],
    });

    expect(await screen.getByText('First tab')).toBeInTheDocument();
    expect(await screen.getByText('Tab 2')).toBeInTheDocument();
    expect(await screen.findByText('Attribute 1')).toBeInTheDocument();
    expect(await screen.queryByText('City')).not.toBeInTheDocument();
    expect(await screen.findByText('1: Test')).toBeInTheDocument();
    expect(await screen.findByText('10: Test')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('Tab 2'));

    await waitFor(() => {
      expect(screen.queryByText('Attribute 1')).not.toBeInTheDocument();
    }, { timeout: 100 });

    expect(await screen.findByText('Country')).toBeInTheDocument();
    expect(await screen.findByText('City')).toBeInTheDocument();
    expect(await screen.findByText('1: The Netherlands')).toBeInTheDocument();
    expect(await screen.findByText('10: Zonnebaan')).toBeInTheDocument();
  });

});
