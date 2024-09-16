import { render, screen } from '@testing-library/angular';
import { FeatureInfoLayerItemComponent } from './feature-info-layer-item.component';
import { LoadingStateEnum, SharedDirectivesModule } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('FeatureInfoLayerItemComponent', () => {

  test('should render', async () => {
    const dispatch = jest.fn();
    await render(FeatureInfoLayerItemComponent, {
      imports: [ MatIconModule, MatIconTestingModule, SharedDirectivesModule ],
      providers: [{ provide: Store, useValue: { dispatch } }],
      inputs: {
        layer: { id: '1', title: 'Layer1', loading: LoadingStateEnum.LOADED, totalCount: 2, disabled: false, selected: false },
      },
    });
    expect(await screen.findByText('Layer1 (2)')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Layer1 (2)'));
    expect(dispatch).toHaveBeenCalledWith(setSelectedFeatureInfoLayer({ layer: '1' }));
  });

});
