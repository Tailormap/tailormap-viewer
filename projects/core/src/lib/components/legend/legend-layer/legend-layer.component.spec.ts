import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { LegendLayerComponent } from './legend-layer.component';
import { getAppLayerModel, getServiceModel } from '@tailormap-viewer/api';
import { ImageWithDescriptionComponent, LegendImageComponent, LegendImageSettingsModel } from '@tailormap-viewer/shared';
import { LegendInfoModel } from '../models/legend-info.model';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
  selector: 'tm-image-with-description',
  template: '<img [src]="src()" [srcset]="legendSettings()?.srcset ?? \'\'" [alt]="legendSettings()?.altText ?? \'\'" />',
})
class MockImageWithDescriptionComponent {
  public src = input<string>('');
  public legendSettings = input<LegendImageSettingsModel | null>(null);
}

const windowMock = () => Object.defineProperty({}, 'devicePixelRatio', {
  get: vi.fn().mockReturnValue(2),
}) as any;

const setup = async (legendInfo: LegendInfoModel) => {
  TestBed.overrideComponent(LegendImageComponent, {
    set: { imports: [MockImageWithDescriptionComponent] },
  });
  await render(LegendLayerComponent, {
    imports: [],
    declarations: [ LegendImageComponent ],
    inputs: { legendInfo },
  });
};

describe('LegendLayerComponent', () => {

  test('should render', async () => {
    await setup({
      layer: getAppLayerModel({ title: 'Layer title' }),
      url: 'some-url',
      isInScale: true,
    });
    expect(await screen.getByText('Layer title')).toBeInTheDocument();
    const img = await screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toEqual('some-url');
    expect(img.getAttribute('alt')).toEqual('Legend for Layer title');
  });

  test('should render high dpi legend for GeoServer', async () => {
    vi.spyOn(global, 'window', 'get').mockImplementation(windowMock);
    await setup({
      layer: { ...getAppLayerModel({ title: 'Layer title' }), service: getServiceModel() },
      url: 'http://some-url/geoserver/wms?REQUEST=GetLegendGraphic',
      isInScale: true,
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
