import { render, screen } from '@testing-library/angular';
import { Switch3DComponent } from './switch3-d.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectEnable3D } from '../../../state/core.selectors';

describe('Switch3DComponent', () => {

  test('should render', async () => {
    await render(Switch3DComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MatSnackBar, useValue: { dismiss: jest.fn() } },
        provideMockStore({
          selectors: [
            { selector: selectEnable3D, value: true },
          ],
        }),
      ],
    });
    expect(screen.getByLabelText('Switch to 3D')).toBeInTheDocument();
  });

  test('should not render', async () => {
    await render(Switch3DComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MatSnackBar, useValue: { dismiss: jest.fn() } },
        provideMockStore({
          selectors: [
            { selector: selectEnable3D, value: false },
          ],
        }),
      ],
    });
    expect(screen.queryByLabelText('Switch to 3D')).not.toBeInTheDocument();
  });

});
