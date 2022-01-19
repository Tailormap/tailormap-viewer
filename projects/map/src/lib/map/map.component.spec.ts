import { MapComponent } from './map.component';
import { render } from '@testing-library/angular';
import { MapService } from '../map-service/map.service';

describe('MapComponent', () => {

  test('should create the app', async () => {
    const mockRender = jest.fn();
    await render(MapComponent, {
      componentProviders: [
        {
          provide: MapService,
          useValue: { render: mockRender },
        },
      ],
    });
    expect(mockRender).toHaveBeenCalled();
  });

});
