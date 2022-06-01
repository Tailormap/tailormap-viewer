import { TocComponent } from './toc.component';
import { render, screen } from '@testing-library/angular';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { getTreeModelMock, SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedCoreComponentsModule } from '../../../shared/components/shared-core-components.module';
import { selectLayerTree, selectSelectedNode } from '../../../map/state/map.selectors';
import { setLayerVisibility, setSelectedLayerId } from '../../../map/state/map.actions';

const getMockStore = (selectedLayer: string = '') => {
  const tree = [
    getTreeModelMock({
      label: 'Disaster map',
      metadata: {
        id: 1,
        layerName: 'Disaster map',
      },
    }),
    getTreeModelMock({
      id: '2',
      label: 'Some other map',
      metadata: {
        id: 2,
        layerName: 'Some other map',
      },
    }),
  ];
  return provideMockStore({
    selectors: [
      { selector: selectLayerTree, value: tree },
      { selector: selectSelectedNode, value: selectedLayer },
    ],
  });
};

const getMenubarService = (visible: boolean, registerComponentFn: jest.Mock) => {
  return { provide: MenubarService, useValue: { isComponentVisible$: () => of(visible), registerComponent: registerComponentFn }};
};

describe('TocComponent', () => {

  test('renders TOC with visible false', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
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
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
      providers: [
        getMockStore(),
        getMenubarService(true, registerComponentFn),
      ],
    });
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.findByText('Some other map')).toBeInTheDocument();
  });

  test('handles layer selection', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
      providers: [
        getMockStore('1'),
        getMenubarService(true, registerComponentFn),
      ],
    });
    const store = TestBed.inject(MockStore);
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
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
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
