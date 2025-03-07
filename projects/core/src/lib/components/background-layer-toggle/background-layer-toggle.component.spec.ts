import { render, screen } from '@testing-library/angular';
import { BackgroundLayerToggleComponent } from './background-layer-toggle.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import {
  selectBackgroundNodesList, selectIn3DView, selectInitiallySelectedBackgroundNodes, selectLayersWithoutWebMercator,
  selectSelectedBackgroundNodeId,
} from '../../map/state/map.selectors';
import { getLayerTreeNode } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const getMockedState = (initiallySelected = '') => {
  return provideMockStore({
    selectors: [
      { selector: selectSelectedBackgroundNodeId, value: initiallySelected },
      { selector: selectBackgroundNodesList, value: [getLayerTreeNode({ id: '1', name: 'Backgrounds' })] },
      { selector: selectInitiallySelectedBackgroundNodes, value: [ getLayerTreeNode({ name: 'Test' }), getLayerTreeNode({ name: 'Test 2' }) ] },
      { selector: selectIn3DView, value: false },
      { selector: selectLayersWithoutWebMercator, value: [] },
    ],
  });
};

describe('BackgroundLayerToggleComponent', () => {

  test('should render', async () => {
    await render(BackgroundLayerToggleComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        getMockedState(),
      ],
    });
    expect(screen.getByText('Test, Test 2'));
  });

  test('should render default selected', async () => {
    await render(BackgroundLayerToggleComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        getMockedState('1'),
      ],
    });
    expect(screen.getByText('Backgrounds'));
  });

});
