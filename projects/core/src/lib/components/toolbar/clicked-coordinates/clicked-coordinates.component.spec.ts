import { render, screen } from '@testing-library/angular';
import { ClickedCoordinatesComponent } from './clicked-coordinates.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

describe('ClickedCoordinatesComponent', () => {

  test('should render', async () => {
    const mapServiceMock = getMapServiceMock();
    await render(ClickedCoordinatesComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        mapServiceMock.provider,
        provideMockStore({
          selectors: [
            { selector: isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES), value: true },
          ],
        }),
      ],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
    expect(screen.getByLabelText('Coordinate picker'));
  });

});
