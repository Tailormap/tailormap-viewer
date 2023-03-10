import { render, screen } from '@testing-library/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { StreetviewComponent } from './streetview.component';

describe('StreetviewComponent', () => {

  test('should render', async () => {
    const createTool = jest.fn(() => of('1'));
    const getProjectionCode = jest.fn(() => of('EPSG:28992'));
    const renderFeatures = jest.fn(()=> of());
    await render(StreetviewComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MapService, useValue: { createTool$: createTool, getProjectionCode$: getProjectionCode, renderFeatures$: renderFeatures } },
        provideMockStore({
          selectors: [
            { selector: isActiveToolbarTool(ToolbarComponentEnum.STREETVIEW), value: true },
          ],
        }),
      ],
    });
    expect(createTool).toHaveBeenCalled();
    expect(getProjectionCode).toHaveBeenCalled();
    expect(screen.getByLabelText('Open Streetview'));
  });

});
