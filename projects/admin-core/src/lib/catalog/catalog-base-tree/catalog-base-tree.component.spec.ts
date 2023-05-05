import { render, screen, waitFor } from '@testing-library/angular';
import { CatalogBaseTreeComponent } from './catalog-base-tree.component';
import { LoadingStateEnum, SharedModule, TreeService } from '@tailormap-viewer/shared';
import { CatalogNodeModel, getCatalogTree, getGeoService, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import userEvent from '@testing-library/user-event';
import { addGeoServices } from '../state/catalog.actions';
import { getMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CatalogBaseTreeNodeComponent } from './catalog-base-tree-node/catalog-base-tree-node.component';
import { Store } from '@ngrx/store';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { TestBed } from '@angular/core/testing';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';

const setup = async (state: Partial<CatalogState> = {}) => {
  const mockStore = getMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, ...state } },
  });
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  const mockApiService = {
    getGeoServices$: jest.fn(() => {
      return of([getGeoService()]);
    }),
  };
  await render(CatalogBaseTreeComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [CatalogBaseTreeNodeComponent],
    providers: [
      TreeService,
      { provide: Store, useValue: mockStore },
      { provide: TAILORMAP_ADMIN_API_V1_SERVICE, useValue: mockApiService },
    ],
  });
  const treeService = TestBed.inject(TreeService);
  return { mockStore, mockDispatch, mockApiService, treeService };
};

const getExtendedCatalogNodes = (catalogNodes: CatalogNodeModel[]) => {
  return catalogNodes.map<ExtendedCatalogNodeModel>(node => ({ ...node, parentId: catalogNodes.find(c => c.children?.includes(node.id))?.id || null }));
};

describe('CatalogBaseTreeComponent', () => {

  test('should trigger loading catalog', async () => {
    const { mockDispatch } = await setup();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Catalog] Load Catalog' });
  });

  test('should render spinner when loading', async () => {
    await setup({ catalogLoadStatus: LoadingStateEnum.LOADING });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  test('should render tree for nodes and load service when expanding node', async () => {
    const catalogNodes = getExtendedCatalogNodes(getCatalogTree());
    const state: Partial<CatalogState> = {
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog: catalogNodes,
    };
    const { mockDispatch, mockApiService, treeService } = await setup(state);
    treeService.setDataSource(of(CatalogTreeHelper.catalogToTree(catalogNodes, [], [], [], [])));

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
    const catalogNodes = getExtendedCatalogNodes(getCatalogTree());
    const geoServices = [{ ...getGeoService({ id: '1' }), layers: [], catalogNodeId: 'child1.1' }, { ...getGeoService({ id: '2' }), layers: [], catalogNodeId: 'child1.1' }];
    const state: Partial<CatalogState> = {
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog: catalogNodes,
      geoServices,
    };
    const { mockDispatch, mockApiService, treeService } = await setup(state);
    treeService.setDataSource(of(CatalogTreeHelper.catalogToTree(catalogNodes, geoServices, [], [], [])));

    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByText(`Background services`)).toBeInTheDocument();

    await userEvent.click(await screen.findByLabelText(`expand Background services`));
    await userEvent.click(await screen.findByLabelText(`expand Background services - aerial`));
    expect(mockApiService.getGeoServices$).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledTimes(2); // expand, expand
  });

});
