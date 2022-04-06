import { TocComponent } from './toc.component';
import { render, screen } from '@testing-library/angular';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { TocService } from '../services/toc.service';
import { of } from 'rxjs';
import { getTreeModelMock, SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedCoreComponentsModule } from '../../../shared/components/shared-core-components.module';
import { selectLayerTree, selectSelectedLayerId } from '../../../map/state/map.selectors';
import { setLayerVisibility, setSelectedLayerId } from '../../../map/state/map.actions';

const getMockStore = (selectedLayer: string = '') => {
  const tree = [
    getTreeModelMock({ label: 'Disaster map' }),
    getTreeModelMock({ id: '2', label: 'Some other map' }),
  ];
  return provideMockStore({
    selectors: [
      { selector: selectLayerTree, value: tree },
      { selector: selectSelectedLayerId, value: selectedLayer },
    ],
  });
};

const getTocService = (visible: boolean) => {
  return { provide: TocService, useValue: { isVisible$: () => of(visible) }};
};

describe('TocComponent', () => {

  test('renders TOC with visible false', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
      providers: [
        getMockStore(),
        getTocService(false),
        { provide: MenubarService, useValue: { registerComponent: registerComponentFn }},
      ],
    });
    expect(await screen.queryByText('Available layers')).toBeNull();
    expect(registerComponentFn).toHaveBeenCalled();
  });

  test('renders TOC with visible true', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
      providers: [
        getMockStore(),
        getTocService(true),
        { provide: MenubarService, useValue: { registerComponent: registerComponentFn }},
      ],
    });
    expect(await screen.findByText('Available layers')).toBeInTheDocument();
    expect(await screen.findByText('Disaster map')).toBeInTheDocument();
    expect(await screen.findByText('Some other map')).toBeInTheDocument();
  });

  test('handles layer selection', async () => {
    const registerComponentFn = jest.fn();
    await render(TocComponent, {
      imports: [ SharedModule, SharedCoreComponentsModule, MatIconTestingModule ],
      providers: [
        getMockStore('1'),
        getTocService(true),
        { provide: MenubarService, useValue: { registerComponent: registerComponentFn }},
      ],
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    expect((await screen.findByText('Disaster map')).closest('.mat-tree-node')).toHaveClass('tree-node--selected');
    userEvent.click(await screen.findByText('Some other map'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: setSelectedLayerId.type, layerId: '2' });
    store.overrideSelector(selectSelectedLayerId, 2);
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
        getTocService(true),
        { provide: MenubarService, useValue: { registerComponent: registerComponentFn }},
      ],
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    userEvent.click(await screen.findByLabelText('toggle Disaster map'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: setLayerVisibility.type, visibility: { 1: true } });
  });

});
