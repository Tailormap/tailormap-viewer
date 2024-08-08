import { TocComponent } from './toc.component';
import { render, screen, waitFor } from '@testing-library/angular';
import { createMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectLayers, selectLayerTreeNodes, selectSelectedNode } from '../../../map/state/map.selectors';
import { setLayerVisibility, setSelectedLayerId } from '../../../map/state/map.actions';
import { TocNodeLayerComponent } from '../toc-node-layer/toc-node-layer.component';
import { ToggleAllLayersButtonComponent } from '../toggle-all-layers-button/toggle-all-layers-button.component';
import { getAppLayerModel, getLayerTreeNode } from '@tailormap-viewer/api';
import { TocFilterInputComponent } from '../toc-filter-input/toc-filter-input.component';
import { toggleFilterEnabled } from '../state/toc.actions';
import { selectFilterEnabled, selectFilterTerm, selectInfoTreeNodeId } from '../state/toc.selectors';
import { Store } from '@ngrx/store';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const buildMockStore = (selectedLayer = '') => {
  const layers = [
    getAppLayerModel({ title: 'Disaster map', visible: false }),
    getAppLayerModel({ id: '2', title: 'Some other map', visible: false }),
  ];
  const tree = [
    getLayerTreeNode({ childrenIds: [ '1', '2' ] }),
    getLayerTreeNode({ id: '1', name: 'Disaster map', appLayerId: '1' }),
    getLayerTreeNode({ id: '2', name: 'Some other map', appLayerId: '2' }),
  ];
  return createMockStore({
    selectors: [
      { selector: selectFilterEnabled, value: false },
      { selector: selectFilterTerm, value: null },
      { selector: selectInfoTreeNodeId, value: null },
      { selector: selectLayers, value: layers },
      { selector: selectLayerTreeNodes, value: tree },
      { selector: selectSelectedNode, value: selectedLayer },
    ],
  });
};

const getMenubarService = (visible: boolean, registerComponentFn: jest.Mock) => {
  return { provide: MenubarService, useValue: { isComponentVisible$: () => of(visible), registerComponent: registerComponentFn } };
};

const setup = async (visible: boolean, selectedLayer = '') => {
  const registerComponentFn = jest.fn();
  const mockStore = buildMockStore(selectedLayer);
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  await render(TocComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    declarations: [ TocNodeLayerComponent, ToggleAllLayersButtonComponent, TocFilterInputComponent ],
    providers: [
      getMapServiceMock().provider,
      { provide: Store, useValue: mockStore },
      getMenubarService(visible, registerComponentFn),
    ],
  });
  return { registerComponentFn, mockStore, mockDispatch };
};

describe('TocComponent', () => {

  test('renders TOC with visible false', async () => {
    const { registerComponentFn } = await setup(false);
    expect(registerComponentFn).toHaveBeenCalled();
  });

  test('renders TOC with visible true', async () => {
    await setup(true);
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.findByText('Some other map')).toBeInTheDocument();
  });

  test('renders TOC with filter term', async () => {
    const { mockStore, mockDispatch } = await setup(true);
    await userEvent.click(await screen.findByLabelText('Filter layers'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: toggleFilterEnabled.type });
    mockStore.overrideSelector(selectFilterEnabled, true);
    mockStore.overrideSelector(selectFilterTerm, 'dis');
    mockStore.refreshState();
    expect(await screen.findByPlaceholderText('Filter by layer name...')).toBeInTheDocument();
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.queryByText('Some other map')).not.toBeInTheDocument();
  });

  test('handles layer selection', async () => {
    const { mockStore, mockDispatch } = await setup(true, '1');
    expect((await screen.findByText('Disaster map')).closest('.mat-tree-node')).toHaveClass('tree-node--selected');
    await userEvent.click(await screen.findByText('Some other map'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: setSelectedLayerId.type, layerId: '2' });
    mockStore.overrideSelector(selectSelectedNode, '2');
    mockStore.refreshState();
    await waitFor(() => {
      expect((screen.getByText('Disaster map')).closest('.mat-tree-node')).not.toHaveClass('tree-node--selected');
      expect((screen.getByText('Some other map')).closest('.mat-tree-node')).toHaveClass('tree-node--selected');
    });
  });

  test('handles checking layer', async () => {
    const { mockDispatch } = await setup(true, '1');
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.getByLabelText('toggle Disaster map')).toBeInTheDocument();
    await userEvent.click(await screen.getByLabelText('toggle Disaster map'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: setLayerVisibility.type, visibility: [{ id: '1', checked: true }] });
  });

});
