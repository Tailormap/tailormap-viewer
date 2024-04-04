import { render, screen } from '@testing-library/angular';
import { CatalogBaseTreeComponent } from './catalog-base-tree.component';
import { LoadingStateEnum, SharedModule, TreeService } from '@tailormap-viewer/shared';
import { CatalogNodeModel, getCatalogTree, getGeoService, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import userEvent from '@testing-library/user-event';
import { createMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CatalogBaseTreeNodeComponent } from './catalog-base-tree-node/catalog-base-tree-node.component';
import { Store } from '@ngrx/store';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { TestBed } from '@angular/core/testing';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { adminCoreStateKey, initialAdminCoreState } from '../../state/admin-core.state';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';

const setup = async (state: Partial<CatalogState> = {}) => {
  const mockStore = createMockStore({
    initialState: {
      [catalogStateKey]: { ...initialCatalogState, ...state },
      [adminCoreStateKey]: { ...initialAdminCoreState },
    },
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
      { provide: TailormapAdminApiV1Service, useValue: mockApiService },
    ],
  });
  const treeService = TestBed.inject(TreeService);
  return { mockStore, mockDispatch, mockApiService, treeService };
};

const getExtendedCatalogNodes = (catalogNodes: CatalogNodeModel[]) => {
  return catalogNodes.map<ExtendedCatalogNodeModel>(node => ({
    ...node,
    parentId: catalogNodes.find(c => c.children?.includes(node.id))?.id || null,
    type: CatalogExtendedTypeEnum.CATALOG_NODE_TYPE,
  }));
};

describe('CatalogBaseTreeComponent', () => {

  test('should trigger loading catalog', async () => {
    const { mockDispatch } = await setup();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Admin/Catalog] Load Catalog' });
  });

  test('should render spinner when loading', async () => {
    await setup({ catalogLoadStatus: LoadingStateEnum.LOADING });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  test('should render tree for nodes', async () => {
    const catalogNodes = getExtendedCatalogNodes(getCatalogTree());
    const state: Partial<CatalogState> = {
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog: catalogNodes,
    };
    const treeDataSource = new BehaviorSubject(CatalogTreeHelper.catalogToTree(catalogNodes, [], [], [], [], []));
    const { mockStore, mockDispatch, mockApiService, treeService } = await setup(state);
    treeService.setDataSource(treeDataSource.asObservable());

    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByText(`Background services`)).toBeInTheDocument();

    await userEvent.click(await screen.findByLabelText(`expand Background services`));
    treeDataSource.next(CatalogTreeHelper.catalogToTree(catalogNodes.map(c => ({ ...c, expanded: true })), [], [], [], [], []));
    expect(await screen.findByText(`Background services - aerial`)).toBeInTheDocument();
  });

});
