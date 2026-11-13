import { describe, test, expect, vi } from 'vitest';
import { MapComponent } from './map.component';
import { render } from '@testing-library/angular';
import { MapService } from '../map-service/map.service';
import { of } from 'rxjs';
import { Provider } from '@angular/core';
import { MAP_COOPERATIVE_GESTURES } from './map-cooperative-gestures.injection-token';

const setup = async (providers: Provider[] = []) => {
  const mockRender = vi.fn();
  const mockCesiumManager = {
    executeScene3dAction: vi.fn(),
    enableKeyboardControl: vi.fn(),
  };
  const { container } = await render(MapComponent, {
    providers,
    componentProviders: [
      {
        provide: MapService,
        useValue: { render: mockRender, getCesiumManager$: () => of(mockCesiumManager) },
      },
    ],
  });
  return { mockRender, container };
};

describe('MapComponent', () => {

  test('should create the app', async () => {
    const { mockRender, container } = await setup();
    expect(mockRender).toHaveBeenCalled();
    // not in an iframe, so no cooperative gestures overlay by default
    expect(container.querySelector('.cooperative-gestures-overlay')).toBeNull();
  });

  test('shows the cooperative gestures overlay when provided', async () => {
    const { container } = await setup([{ provide: MAP_COOPERATIVE_GESTURES, useValue: true }]);
    expect(container.querySelector('.cooperative-gestures-overlay')).not.toBeNull();
  });

});
