import { render, screen, waitFor } from '@testing-library/angular';
import { CatalogTreeComponent } from './catalog-tree.component';
import { createMockStore } from '@ngrx/store/testing';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import { createSelector, Store } from '@ngrx/store';
import {
  CatalogNodeModel, getCatalogTree, getGeoService, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1MockService,
} from '@tailormap-admin/admin-api';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { addGeoServices } from '../state/catalog.actions';
import { CatalogTreeNodeComponent } from './catalog-tree-node/catalog-tree-node.component';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogBaseTreeComponent } from '../catalog-base-tree/catalog-base-tree.component';
import { CatalogBaseTreeNodeComponent } from '../catalog-base-tree/catalog-base-tree-node/catalog-base-tree-node.component';

const setup = async (state: Partial<CatalogState> = {}) => {
  const mockStore = createMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, ...state } },
  });
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  const mockApiService = {
    getGeoServices$: jest.fn(() => {
      return of([getGeoService()]);
    }),
  };
  await render(CatalogTreeComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ CatalogTreeNodeComponent, CatalogBaseTreeComponent, CatalogBaseTreeNodeComponent ],
    providers: [
      { provide: Store, useValue: mockStore },
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });
  return { mockStore, mockDispatch, mockApiService };
};

const getExtendedCatalogNodes = (catalogNodes: CatalogNodeModel[]) => {
  return catalogNodes.map<ExtendedCatalogNodeModel>(node => ({ ...node, parentId: catalogNodes.find(c => c.children?.includes(node.id))?.id || null }));
};

describe('CatalogTreeComponent', () => {

  test('should trigger loading catalog', async () => {
    const { mockDispatch } = await setup();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Catalog] Load Catalog' });
  });

  test('should render spinner when loading', async () => {
    await setup({ catalogLoadStatus: LoadingStateEnum.LOADING });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  test('should render tree for nodes and load service when expanding node', async () => {
    const catalogNodes = getCatalogTree();
    const state: Partial<CatalogState> = {
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog: getExtendedCatalogNodes(catalogNodes),
    };
    const { mockDispatch, mockApiService } = await setup(state);
    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByText(`Background services`)).toBeInTheDocument();

    await userEvent.click(await screen.findByLabelText(`expand Background services`));
    await userEvent.click(await screen.findByLabelText(`expand Background services - aerial`));
    await waitFor(() => {
      expect(mockApiService.getGeoServices$).toHaveBeenCalledTimes(1);
    });
    expect(mockDispatch).toHaveBeenCalledTimes(3); // expand, expand, add services
    expect(mockDispatch.mock.calls[2][0].type).toEqual(addGeoServices.type);
  });

  test('should render tree for nodes and not load service for already loaded services', async () => {
    const catalogNodes = getCatalogTree();
    const state: Partial<CatalogState> = {
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog: getExtendedCatalogNodes(catalogNodes),
      geoServices: [{ ...getGeoService({ id: '1' }), layers: [], catalogNodeId: 'child1.1' }, { ...getGeoService({ id: '2' }), layers: [], catalogNodeId: 'child1.1' }],
    };
    const { mockDispatch, mockApiService } = await setup(state);
    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByText(`Background services`)).toBeInTheDocument();

    await userEvent.click(await screen.findByLabelText(`expand Background services`));
    await userEvent.click(await screen.findByLabelText(`expand Background services - aerial`));
    expect(mockApiService.getGeoServices$).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledTimes(2); // expand, expand
  });

});
