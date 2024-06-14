import { render, screen } from '@testing-library/angular';
import { LegendImageComponent } from './legend-image.component';

const windowMock = () => Object.defineProperty({}, 'devicePixelRatio', {
  get: jest.fn().mockReturnValue(2),
}) as any;

describe('LegendImageComponent', () => {

  test('should render', async () => {
    await render(LegendImageComponent, {
      componentProperties: {
        title: 'Layer title',
        url: 'some-url',
        serverType: 'generic',
      },
    });
    const img = await screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toEqual('some-url');
    expect(img.getAttribute('alt')).toEqual('Failed to load legend for Layer title');
  });

  test('should render high dpi legend for GeoServer', async () => {
    jest.spyOn(global, 'window', 'get').mockImplementation(windowMock);
    await render(LegendImageComponent, {
      componentProperties: {
        title: 'Layer title',
        url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
        serverType: 'geoserver',
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
