import { render, screen } from '@testing-library/angular';
import { Switch3DComponent } from './switch3-d.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ClickedCoordinatesComponent', () => {

  test('should render', async () => {
    const createTool = jest.fn(() => of('1'));
    await render(Switch3DComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MatSnackBar, useValue: { dismiss: jest.fn() } },
        { provide: MapService, useValue: { createTool$: createTool } },
        provideMockStore({
          selectors: [
            { selector: isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES), value: true },
          ],
        }),
      ],
    });
    expect(createTool).toHaveBeenCalled();
    expect(screen.getByLabelText('Coordinate picker'));
  });

});
