import { render, screen } from '@testing-library/angular';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle.component';
import { provideMockStore } from '@ngrx/store/testing';
import {
  selectInitiallySelectedTerrainNodes,
  selectSelectedTerrainNodeId,
  selectTerrainNodesList,
} from '../../../../map/state/map.selectors';
import { getLayerTreeNode } from '@tailormap-viewer/api';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { MobileLayoutService } from '../../../../services/viewer-layout/mobile-layout.service';

const getMockedState = (initiallySelected = '') => {
  return provideMockStore({
    selectors: [
      { selector: selectSelectedTerrainNodeId, value: initiallySelected },
      { selector: selectTerrainNodesList, value: [getLayerTreeNode({ id: '1', name: 'AHN terrain' })] },
      { selector: selectInitiallySelectedTerrainNodes, value: [ getLayerTreeNode({ name: 'Test' }), getLayerTreeNode({ name: 'Test 2' }) ] },
    ],
  });
};

const setup = async (initiallySelected: string) => {
  const mockStore = getMockedState(initiallySelected);
  const mockMobileLayoutService = { isMobileLayoutEnabled$: of(false) };
  await render(TerrainLayerToggleComponent, {
    imports: [ SharedModule, CommonModule, MatIconTestingModule ],
    providers: [
      mockStore,
      { provide: MobileLayoutService, useValue: mockMobileLayoutService },
    ],
  });
}

describe('TerrainLayerToggleComponent', () => {

  test('should render default terrain name', async () => {
    await setup('');
    expect(screen.getByText('WGS84 Ellipsoid'));
  });

  test('should render selected', async () => {
    await setup('1');
    expect(screen.getByText('AHN terrain'));
  });

});
