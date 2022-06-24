import { render, screen } from '@testing-library/angular';
import { getLoadedStoreNoRows, getLoadedStoreWithRows, getLoadingStore } from '../state/mocks/attribute-list-state-test-data';
import { provideMockStore } from '@ngrx/store/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeListTableComponent } from '../attribute-list-table/attribute-list-table.component';
import { MatTableModule } from '@angular/material/table';
import { PanelResizerComponent } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';
import { AttributeListComponent } from './attribute-list.component';
import { AttributeListState, attributeListStateKey } from '../state/attribute-list.state';
import { initialMapState, mapStateKey } from '../../../map/state/map.state';
import { AppLayerModel } from '@tailormap-viewer/api';

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
  };
};

describe('AttributeList', () => {

  it('does not render for hidden attribute list', async () => {
    const store = getStore(getLoadingStore({ visible: false }));
    await render(AttributeListComponent, {
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

    );
    await render(AttributeListComponent, {
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.queryByRole('tabpanel')).toBeInTheDocument();
    expect(await screen.getByText('No layers with administrative data found')).toBeInTheDocument();
  });

});
