import { render, screen } from '@testing-library/angular';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { selectMapSettings } from '../../../map/state/map.selectors';

describe('ClickedCoordinatesComponent', () => {
  test('should render button', async () => {
    const mapServiceMock = getMapServiceMock();
    await render(ClickedCoordinatesComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        mapServiceMock.provider,
        provideMockStore({
          selectors: [
            { selector: selectMapSettings, value: { crs: { code: 'EPSG:4326' }, maxExtent: { minx: -180, miny: -90, maxx: 180, maxy: 90 } } },
          ],
        }),
      ],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
    const zoomToLocationBtn = screen.getByLabelText('Coordinate picker');
    expect(zoomToLocationBtn).toBeInTheDocument();
  });
});
