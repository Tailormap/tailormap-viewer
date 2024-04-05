import { render, screen, waitFor } from '@testing-library/angular';
import { LayerTransparencyComponent } from './layer-transparency.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { setLayerOpacity } from '../../../../map/state/map.actions';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';

describe('LayerTransparencyComponent', () => {

  test('should render', async () => {
    await render(LayerTransparencyComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentProperties: {
        layer: '1',
      },
      providers: [
        provideMockStore({
          initialState: {
            map: {
              layers: [{ id: '1', opacity: 50, initialValues: { opacity: 100 } }],
            },
          },
        }),
      ],
    });
    const dispatch = jest.fn();
    const store = TestBed.inject(MockStore);
    store.dispatch = dispatch;

    expect(screen.getByText('Opacity'));
    await waitFor(() => {
      expect(screen.getByText('50%'));
    });

    await userEvent.click(screen.getByLabelText('Reset opacity'));
    expect(dispatch).toHaveBeenCalledWith(setLayerOpacity({ opacity: [{ id: '1', opacity: 100 }] } ));
  });

});
