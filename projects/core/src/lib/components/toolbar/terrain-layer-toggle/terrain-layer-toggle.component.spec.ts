import { render, screen } from '@testing-library/angular';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle.component';
import { provideMockStore } from '@ngrx/store/testing';
import {
  selectInitiallySelectedTerrainNodes,
  selectSelectedTerrainNodeId,
  selectTerrainNodesList,
} from '../../../map/state/map.selectors';
import { getLayerTreeNode } from '@tailormap-viewer/api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CommonModule } from '@angular/common';

const getMockedState = (initiallySelected = '') => {
  return provideMockStore({
    selectors: [
      { selector: selectSelectedTerrainNodeId, value: initiallySelected },
      { selector: selectTerrainNodesList, value: [getLayerTreeNode({ id: '1', name: 'AHN terrain' })] },
      { selector: selectInitiallySelectedTerrainNodes, value: [ getLayerTreeNode({ name: 'Test' }), getLayerTreeNode({ name: 'Test 2' }) ] },
    ],
  });
};

describe('TerrainLayerToggleComponent', () => {

  test('should render', async () => {
    await render(TerrainLayerToggleComponent, {
      imports: [ SharedModule, CommonModule, MatIconTestingModule ],
      providers: [
        getMockedState(),
      ],
    });
    expect(screen.getByText('Test, Test 2'));
  });

  test('should render default selected', async () => {
    await render(TerrainLayerToggleComponent, {
      imports: [ SharedModule, CommonModule, MatIconTestingModule ],
      providers: [
        getMockedState('1'),
      ],
    });
    expect(screen.getByText('AHN terrain'));
  });

});
