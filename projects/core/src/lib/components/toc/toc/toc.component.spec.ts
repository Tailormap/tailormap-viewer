import { TocComponent } from './toc.component';
import { render, screen } from '@testing-library/angular';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectLayers, selectLayerTreeNodes, selectSelectedNode } from '../../../map/state/map.selectors';
import { setLayerVisibility, setSelectedLayerId } from '../../../map/state/map.actions';
import { TocNodeLayerComponent } from '../toc-node-layer/toc-node-layer.component';
import { ToggleAllLayersButtonComponent } from '../toggle-all-layers-button/toggle-all-layers-button.component';
import { getAppLayerModel, getLayerTreeNode } from '@tailormap-viewer/api';
import { initialTocState, tocStateKey } from '../state/toc.state';
import { TocFilterInputComponent } from '../toc-filter-input/toc-filter-input.component';
import { toggleFilterEnabled } from '../state/toc.actions';
import { selectFilterEnabled, selectFilterTerm } from '../state/toc.selectors';

const getMockStore = (selectedLayer: string = '') => {
  const layers = [
    getAppLayerModel({ title: 'Disaster map', visible: false }),
    getAppLayerModel({ id: 2, title: 'Some other map', visible: false }),
  ];
  const tree = [
    getLayerTreeNode({ childrenIds: [ '1', '2' ] }),
    getLayerTreeNode({ id: '1', name: 'Disaster map', appLayerId: 1 }),
    getLayerTreeNode({ id: '2', name: 'Some other map', appLayerId: 2 }),
  ];
  return provideMockStore({
    initialState: {
      [tocStateKey]: initialTocState,
    },
    selectors: [
      { selector: selectLayers, value: layers },
      { selector: selectLayerTreeNodes, value: tree },
      { selector: selectSelectedNode, value: selectedLayer },
    ],
  });
};

const getMenubarService = (visible: boolean, registerComponentFn: jest.Mock) => {
  return { provide: MenubarService, useValue: { isComponentVisible$: () => of(visible), registerComponent: registerComponentFn } };
};

describe('TocComponent', () => {

  test('renders TOC with visible false', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ TocNodeLayerComponent, ToggleAllLayersButtonComponent ],
      providers: [
        getMockStore(),
        getMenubarService(false, registerComponentFn),
      ],
    });
    expect(registerComponentFn).toHaveBeenCalled();
  });

  test('renders TOC with visible true', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ TocNodeLayerComponent, ToggleAllLayersButtonComponent, TocFilterInputComponent ],
      providers: [
        getMockStore(),
        getMenubarService(true, registerComponentFn),
      ],
    });
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.findByText('Some other map')).toBeInTheDocument();
  });

  test('renders TOC with filter term', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ TocNodeLayerComponent, ToggleAllLayersButtonComponent, TocFilterInputComponent ],
      providers: [
        getMockStore(),
        getMenubarService(true, registerComponentFn),
      ],
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    await userEvent.click(await screen.findByLabelText('Filter layers'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: toggleFilterEnabled.type });
    store.overrideSelector(selectFilterEnabled, true);
    store.overrideSelector(selectFilterTerm, 'dis');
    store.refreshState();
    expect(await screen.findByPlaceholderText('Filter by layer name...')).toBeInTheDocument();
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.queryByText('Some other map')).not.toBeInTheDocument();
  });

  test('handles layer selection', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ TocNodeLayerComponent, ToggleAllLayersButtonComponent, TocFilterInputComponent ],
      providers: [
        getMockStore('1'),
        getMenubarService(true, registerComponentFn),
      ],
    });
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectFilterTerm, null); // ???
    store.refreshState();
    store.dispatch = jest.fn();
    expect((await screen.findByText('Disaster map')).closest('.mat-tree-node')).toHaveClass('tree-node--selected');
    await userEvent.click(await screen.findByText('Some other map'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: setSelectedLayerId.type, layerId: 2 });
    store.overrideSelector(selectSelectedNode, '2');
    store.refreshState();
    expect((await screen.findByText('Disaster map')).closest('.mat-tree-node')).not.toHaveClass('tree-node--selected');
    expect((await screen.findByText('Some other map')).closest('.mat-tree-node')).toHaveClass('tree-node--selected');
  });

  test('handles checking layer', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ TocNodeLayerComponent, ToggleAllLayersButtonComponent, TocFilterInputComponent ],
      providers: [
        getMockStore('1'),
        getMenubarService(true, registerComponentFn),
      ],
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    await userEvent.click(await screen.getByLabelText('toggle Disaster map'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: setLayerVisibility.type, visibility: [{ id: 1, checked: true }] });
  });

});
