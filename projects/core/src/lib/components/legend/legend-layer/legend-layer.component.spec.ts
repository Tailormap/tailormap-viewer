import { render, screen } from '@testing-library/angular';
import { LegendLayerComponent } from './legend-layer.component';
import { getAppLayerModel, getServiceModel } from '@tailormap-viewer/api';
import { LegendImageComponent } from '@tailormap-viewer/shared';

const windowMock = () => Object.defineProperty({}, 'devicePixelRatio', {
  get: jest.fn().mockReturnValue(2),
}) as any;

describe('LegendLayerComponent', () => {

  test('should render', async () => {
    await render(LegendLayerComponent, {
      declarations: [LegendImageComponent],
      componentProperties: {
        legendInfo: {
          layer: getAppLayerModel({ title: 'Layer title' }),
          url: 'some-url',
          isInScale: true,
        },
      },
    });
    expect(await screen.getByText('Layer title')).toBeInTheDocument();
    const img = await screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toEqual('some-url');
    expect(img.getAttribute('alt')).toEqual('Failed to load legend for Layer title');
  });

  test('should render high dpi legend for GeoServer', async () => {
    jest.spyOn(global, 'window', 'get').mockImplementation(windowMock);

    await render(LegendLayerComponent, {
      declarations: [LegendImageComponent],
      componentProperties: {
        legendInfo: {
          layer: { ...getAppLayerModel({ title: 'Layer title' }), service: getServiceModel() },
          url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
          isInScale: true,
        },
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
