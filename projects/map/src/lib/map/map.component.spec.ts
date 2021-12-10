import { MapComponent } from './map.component';
import { render, screen } from '@testing-library/angular';

const mockedMapService = {
  render: (el: HTMLElement) => {
    el.innerHTML = 'rendering map here';
  },
};

describe('MapComponent', () => {

  test('should create the app', async () => {
    const { container } = await render(MapComponent);
    expect(container.querySelector('.ol-viewport')).not.toBeNull();
  });

});
