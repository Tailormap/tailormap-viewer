import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/angular';
import {
  createDummyAttributeListData, createDummyRows, getLoadedStoreNoRows, getLoadedStoreWithRows, getLoadingStore,
} from '../state/mocks/attribute-list-state-test-data';
import { attributeListStateKey } from '../state/attribute-list.state';
import { AttributeListContentComponent } from './attribute-list-content.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { FilterService } from '../../../filter/services/filter.service';
import { LayerFeaturesFilters } from '../../../filter/models/feature-filter.model';
import userEvent from '@testing-library/user-event';
import { createDummyAttributeListTab } from '../state/mocks/attribute-list-state-test-data';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeListTableComponent } from '../attribute-list-table/attribute-list-table.component';
import { MatTableModule } from '@angular/material/table';
import { PanelResizerComponent, TooltipDirective } from '@tailormap-viewer/shared';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { TAILORMAP_API_V1_SERVICE } from '@tailormap-viewer/api';
import { getMockApiService } from '../../../services/load-viewer.service.mock';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { AttributeListDataService } from '../services/attribute-list-data.service';

describe('AttributeListContent', () => {

  it('renders content, loading, no rows', async () => {
    const store = getLoadingStore();
    await render(AttributeListContentComponent, {
      imports: [ MatProgressSpinnerModule, MatDialogModule, MatMenuModule, MatSnackBarModule ],
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService() },
        getMapServiceMock().provider,
        provideMockStore({
          initialState: {
            ...store,
            core: {
              loadStatus: 'LOADED',
              filters: { currentFilterGroups: [] },
            },
            map: { layers: [] },
          },
        }),
      ],
    });
    // If we are still loading we show nothing, we only show no rows found when loading is done
    expect(await screen.queryByText('No rows found')).not.toBeInTheDocument();
  });

  it('renders content, not loading, no rows', async () => {
    const store = getLoadedStoreNoRows();
    await render(AttributeListContentComponent, {
      imports: [ MatDialogModule, MatSnackBarModule ],
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService() },
        getMapServiceMock().provider,
        provideMockStore({
          initialState: {
            ...store,
            core: {
              loadStatus: 'LOADED',
              filters: { currentFilterGroups: [] },
            },
            map: { layers: [] },
          },
        }),
      ],
    });
    expect(await screen.findByText('No rows found')).toBeInTheDocument();
  });

  it('renders content, loaded and with rows', async () => {
    const store = getLoadedStoreWithRows();
    await render(AttributeListContentComponent, {
      imports: [ MatTableModule, MatIconModule, MatDialogModule, MatMenuModule, MatSnackBarModule ],
      declarations: [ AttributeListContentComponent, AttributeListTableComponent, PanelResizerComponent, TooltipDirective ],
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService() },
        getMapServiceMock().provider,
        provideMockStore({
          initialState: {
            ...store,
            core: {
              loadStatus: 'LOADED',
              filters: { currentFilterGroups: [] },
            },
            map: { layers: [] },
          },
        }),
      ],
    });
    expect(await screen.findByText('Attribute 1')).toBeInTheDocument();
    expect(await screen.findByText('1: Test')).toBeInTheDocument();
    expect(await screen.findByText('10: Test')).toBeInTheDocument();
  });

  it('scrolls the table to the top when the page, sort or filter changes', async () => {
    const changedFilters$ = new Subject<Map<string, LayerFeaturesFilters | null>>();
    const state = {
      ...getLoadedStoreWithRows(),
      core: {
        loadStatus: 'LOADED',
        filters: { currentFilterGroups: [] },
      },
      map: { layers: [] },
    };
    const { container, fixture } = await render(AttributeListContentComponent, {
      imports: [ MatDialogModule, MatSnackBarModule ],
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService() },
        getMapServiceMock().provider,
        provideMockStore({ initialState: state }),
        { provide: FilterService, useValue: { getChangedFilters$: () => changedFilters$.asObservable(), getFilterForLayer: () => undefined } },
      ],
    });
    const store = TestBed.inject(MockStore);
    const tableContainer = container.querySelector('.table-container') as HTMLElement;
    const setData = (overrides: Parameters<typeof createDummyAttributeListData>[0]) => {
      store.setState({
        ...state,
        [attributeListStateKey]: {
          ...state[attributeListStateKey],
          data: [createDummyAttributeListData({ rows: createDummyRows(10), ...overrides })],
        },
      });
      fixture.detectChanges();
    };

    tableContainer.scrollTop = 200;
    setData({ selectedRowId: '2' });
    expect(tableContainer.scrollTop).toBe(200);

    setData({ selectedRowId: '2', pageIndex: 2 });
    expect(tableContainer.scrollTop).toBe(0);

    tableContainer.scrollTop = 200;
    setData({ selectedRowId: '2', pageIndex: 2, sortedColumn: 'attribute1', sortDirection: 'asc' });
    expect(tableContainer.scrollTop).toBe(0);

    tableContainer.scrollTop = 200;
    changedFilters$.next(new Map([[ 'other-layer', null ]]));
    expect(tableContainer.scrollTop).toBe(200);

    changedFilters$.next(new Map([[ '1', null ]]));
    expect(tableContainer.scrollTop).toBe(0);
  });

  it('marks the row whose feature is loading after selecting it as busy', async () => {
    const store = getLoadedStoreWithRows();
    await render(AttributeListContentComponent, {
      imports: [ MatTableModule, MatIconModule, MatDialogModule, MatMenuModule, MatSnackBarModule ],
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService() },
        { provide: AttributeListDataService, useValue: { loadingSelectedRow$: of({ dataId: '1', rowId: '2' }) } },
        getMapServiceMock().provider,
        provideMockStore({
          initialState: {
            ...store,
            core: {
              loadStatus: 'LOADED',
              filters: { currentFilterGroups: [] },
            },
            map: { layers: [] },
          },
        }),
      ],
    });
    const loadingRow = (await screen.findByText('2: Test')).closest('mat-row') as HTMLElement;
    expect(loadingRow).toHaveAttribute('aria-busy', 'true');
    expect(within(loadingRow).getByRole('progressbar', { name: 'Loading feature' })).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    const otherRow = screen.getByText('1: Test').closest('mat-row');
    expect(otherRow).not.toHaveAttribute('aria-busy');
  });

  const renderWithRows = async (loadingData: boolean) => {
    const store = getLoadedStoreWithRows({
      tabs: [createDummyAttributeListTab({ loadingData, initialDataLoaded: true })],
    });
    await render(AttributeListContentComponent, {
      imports: [ MatTableModule, MatIconModule, MatDialogModule, MatMenuModule, MatSnackBarModule ],
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useValue: getMockApiService() },
        getMapServiceMock().provider,
        provideMockStore({
          initialState: {
            ...store,
            core: {
              loadStatus: 'LOADED',
              filters: { currentFilterGroups: [] },
            },
            map: { layers: [] },
          },
        }),
      ],
    });
    const mockStore = TestBed.inject(MockStore);
    const dispatch = vi.spyOn(mockStore, 'dispatch');
    return { dispatch };
  };

  it('shows a progress bar and ignores row clicks while loading a page', async () => {
    const { dispatch } = await renderWithRows(true);
    expect(await screen.findByRole('progressbar', { name: 'Loading data' })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Attribute list' });
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(table).toHaveClass('loading');
    await userEvent.click(screen.getByText('1: Test'));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('shows no progress bar and selects a clicked row when not loading', async () => {
    const { dispatch } = await renderWithRows(false);
    await userEvent.click(await screen.findByText('1: Test'));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Attribute list' });
    expect(table).not.toHaveAttribute('aria-busy');
    expect(table).not.toHaveClass('loading');
    expect(dispatch).toHaveBeenCalled();
  });

});
