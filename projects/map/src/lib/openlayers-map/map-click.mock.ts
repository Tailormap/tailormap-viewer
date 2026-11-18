import { vi } from 'vitest';
import { of } from 'rxjs';

export const getMapClickMock = () => {
  return vi.fn(() => of({
    coordinate: [ 1, 2 ],
    pixel: [ 2, 3 ],
    map: {
      getView: () => ({
        getResolution: () => 0.1,
        getProjection: () => ({
          getMetersPerUnit: () => 2,
        }),
      }),
    },
    originalEvent: { pointerType: 'mouse' },
  }));
};
