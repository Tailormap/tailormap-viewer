import { render, screen } from '@testing-library/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
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
      providers: [
        mapServiceMock.provider,
        provideMockStore({
          selectors: [
            { selector: isActiveToolbarTool(ToolbarComponentEnum.STREETVIEW), value: true },
          ],
        }),
      ],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
    expect(mapServiceMock.mapService.getProjectionCode$).toHaveBeenCalled();
    expect(screen.getByLabelText('Open Streetview'));
  });

});
