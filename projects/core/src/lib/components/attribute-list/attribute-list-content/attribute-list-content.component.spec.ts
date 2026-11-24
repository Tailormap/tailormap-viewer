import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import {
  createDummyAttributeListData, createDummyRows, getLoadedStoreNoRows, getLoadedStoreWithRows, getLoadingStore,
} from '../state/mocks/attribute-list-state-test-data';
import { attributeListStateKey } from '../state/attribute-list.state';
import { AttributeListContentComponent } from './attribute-list-content.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TestBed } from '@angular/core/testing';
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

  it('scrolls the table to the top when the page or sort changes', async () => {
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
  });

});
