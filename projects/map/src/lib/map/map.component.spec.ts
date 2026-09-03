import { MapComponent } from './map.component';
import { render } from '@testing-library/angular';
import { MapService } from '../map-service/map.service';
import { of } from 'rxjs';

describe('MapComponent', () => {

  test('should create the app', async () => {
    const mockRender = vi.fn();
    const mockCesiumManager = {
      executeScene3dAction: vi.fn(),
      enableKeyboardControl: vi.fn(),
    };

    await render(MapComponent, {
      componentProviders: [
        {
          provide: MapService,
          useValue: { render: mockRender, getCesiumManager$: () => of(mockCesiumManager) },
        },
      ],
    });
    expect(mockRender).toHaveBeenCalled();
  });

});
