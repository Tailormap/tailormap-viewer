import { render, screen } from '@testing-library/angular';
import { TerrainControlsComponent } from './terrain-controls.component';
import { of } from 'rxjs';
import { LayoutService } from '../../../layout/layout.service';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
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
      isComponentEnabled: vi.fn(() => true),
    };
    await render(TerrainControlsComponent, {
      imports: [ MatIconModule, MatIconTestingModule, CommonModule ],
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
