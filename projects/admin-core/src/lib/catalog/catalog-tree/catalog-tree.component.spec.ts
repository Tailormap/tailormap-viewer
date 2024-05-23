import { render, screen } from '@testing-library/angular';
import { CatalogTreeComponent } from './catalog-tree.component';
import { createMockStore } from '@ngrx/store/testing';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { CatalogNodeModel, getCatalogTree } from '@tailormap-admin/admin-api';
import { CatalogState, catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CatalogTreeNodeComponent } from './catalog-tree-node/catalog-tree-node.component';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { CatalogBaseTreeComponent } from '../catalog-base-tree/catalog-base-tree.component';
import { CatalogBaseTreeNodeComponent } from '../catalog-base-tree/catalog-base-tree-node/catalog-base-tree-node.component';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper';

const setup = async (state: Partial<CatalogState> = {}) => {
  const mockStore = createMockStore({
    initialState: {
      [catalogStateKey]: { ...initialCatalogState, ...state },
    },
  });
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  await render(CatalogTreeComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ CatalogTreeNodeComponent, CatalogBaseTreeComponent, CatalogBaseTreeNodeComponent ],
    providers: [
      { provide: Store, useValue: mockStore },
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
    ],
  });
  const updateMockStore = (updatedState: Partial<CatalogState> = {}) => {
    mockStore.setState({ [catalogStateKey]: { ...initialCatalogState, ...updatedState } });
  };
  return { mockStore, updateMockStore, mockDispatch };
};

const getExtendedCatalogNodes = (catalogNodes: CatalogNodeModel[]) => {
  return catalogNodes.map<ExtendedCatalogNodeModel>(node => ({
    ...node,
    parentId: catalogNodes.find(c => c.children?.includes(node.id))?.id || null,
    type: CatalogExtendedTypeEnum.CATALOG_NODE_TYPE,
  }));
};

describe('CatalogTreeComponent', () => {

  test('should trigger loading catalog', async () => {
    const { mockDispatch } = await setup();
    expect(mockDispatch).toHaveBeenCalledWith({ type: '[Admin/Catalog] Load Catalog' });
  });

  test('should render spinner when loading', async () => {
    await setup({ catalogLoadStatus: LoadingStateEnum.LOADING });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  test('should render tree for nodes and load service when expanding node', async () => {
    const catalogNodes = getExtendedCatalogNodes(getCatalogTree());
    const state: Partial<CatalogState> = {
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog:catalogNodes,
    };
    const { updateMockStore } = await setup(state);
    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByText(`Background services`)).toBeInTheDocument();
    updateMockStore({
      catalogLoadStatus: LoadingStateEnum.LOADED,
      catalog: catalogNodes.map(c => ({ ...c, expanded: true })),
    });
    expect(await screen.findByText(`Background services - aerial`)).toBeInTheDocument();
  });
});
