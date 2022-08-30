import { render, screen } from '@testing-library/angular';
import { LegendLayerComponent } from './legend-layer.component';
import { getAppLayerModel } from '@tailormap-viewer/api';

describe('LegendLayerComponent', () => {

  test('should render', async () => {
    await render(LegendLayerComponent, {
      componentProperties: {
        url: 'some-url',
        layer: getAppLayerModel({ title: 'Layer title' }),
      },
    });
    expect(await screen.getByText('Layer title')).toBeInTheDocument();
    const img = await screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toEqual('some-url');
    expect(img.getAttribute('alt')).toEqual('Failed to load legend for Layer title');
  });

  test('should render high dpi legend for GeoServer', async () => {
    // @ts-ignore
    jest.spyOn(global, 'window', 'get').mockImplementation(() => Object.defineProperty({}, 'devicePixelRatio', {
      get: jest.fn().mockReturnValue(2),
    }));

    await render(LegendLayerComponent, {
      componentProperties: {
        url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
        layer: getAppLayerModel({ title: 'Layer title' }),
      },
    });
    const img = await screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('http://some-url/geoserver/wms');
    expect(img.getAttribute('src')).toContain('LEGEND_OPTIONS=');
    expect(img.getAttribute('src')).toContain('fontAntiAliasing%3Atrue');
    expect(img.getAttribute('srcset')).toContain(' 2x');
    expect(img.getAttribute('srcset')).toContain('dpi%3A180');
  });

});
