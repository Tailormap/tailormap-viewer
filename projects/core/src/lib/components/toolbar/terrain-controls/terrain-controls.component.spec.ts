import { render, screen } from '@testing-library/angular';
import { TerrainControlsComponent } from './terrain-controls.component';
import { of } from 'rxjs';
import { LayoutService } from '../../../layout/layout.service';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '@tailormap-viewer/shared';
import { CommonModule } from '@angular/common';
import { TerrainOpacityComponent } from './terrain-opacity/terrain-opacity.component';
import { TerrainLayerToggleComponent } from './terrain-layer-toggle/terrain-layer-toggle.component';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { provideMockStore } from '@ngrx/store/testing';
import { getLayerTreeNode } from '@tailormap-viewer/api';
import { selectInitiallySelectedTerrainNodes, selectSelectedTerrainNodeId, selectTerrainNodesList } from '../../../map/state/map.selectors';

describe('TerrainControlsComponent', () => {

  test('should render', async () => {
    const mockLayoutService = {
      componentsConfig$: of({
        config: [
          { type: 'TERRAIN_LAYER_TOGGLE', config: {}, enabled: true  },
          { type: 'TERRAIN_OPACITY', config: {}, enabled: true },
        ],
        in3d: true,
      }),
      isComponentEnabled: jest.fn(() => true),
    };
    await render(TerrainControlsComponent, {
      declarations: [ TerrainOpacityComponent, TerrainLayerToggleComponent ],
      imports: [ MatIconModule, MatIconTestingModule, SharedModule, CommonModule ],
      providers: [
        { provide: LayoutService, useValue: mockLayoutService },
        getMapServiceMock().provider,
        provideMockStore({
          selectors: [
            { selector: selectSelectedTerrainNodeId, value: '1' },
            { selector: selectTerrainNodesList, value: [getLayerTreeNode({ id: '1', name: 'AHN terrain' })] },
            { selector: selectInitiallySelectedTerrainNodes, value: [ getLayerTreeNode({ name: 'Test' }), getLayerTreeNode({ name: 'Test 2' }) ] },
          ],
        }),
      ],
    });
    expect(screen.findByText('Opacity'));
    expect(screen.findByText('Model'));
  });

});
