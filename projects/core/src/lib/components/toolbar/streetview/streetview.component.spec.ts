import { render, screen } from '@testing-library/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { StreetviewComponent } from './streetview.component';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

describe('StreetviewComponent', () => {

  test('should render', async () => {
    const mapServiceMock = getMapServiceMock(undefined, 'EPSG:28992');
    await render(StreetviewComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [mapServiceMock.provider],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
    expect(mapServiceMock.mapService.getProjectionCode$).toHaveBeenCalled();
    expect(screen.getByLabelText('Open Streetview'));
  });

});
