import { render, screen } from '@testing-library/angular';
import { FeatureInfoLayerDropdownComponent } from './feature-info-layer-dropdown.component';
import { provideMockStore } from '@ngrx/store/testing';
import { featureInfoStateKey, initialFeatureInfoState } from '../state/feature-info.state';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { LoadingStateEnum, TooltipDirective } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FeatureInfoLayerItemComponent } from '../feature-info-layer-item/feature-info-layer-item.component';
import userEvent from '@testing-library/user-event';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';

const setup = async (layers: FeatureInfoLayerModel[] = []) => {
  return await render(FeatureInfoLayerDropdownComponent, {
    imports: [ MatIconModule, MatProgressSpinnerModule, MatIconTestingModule, ReactiveFormsModule, MatSelectModule ],
    declarations: [ TooltipDirective, FeatureInfoLayerItemComponent ],
    providers: [
      provideMockStore({
        initialState: {
          [featureInfoStateKey]: {
            ...initialFeatureInfoState,
            layers,
          },
        },
      }),
    ],
  });
};

describe('FeatureInfoLayerDropdownComponent', () => {

  test('should render', async () => {
    const { container } = await setup();
    expect(container).toBeEmptyDOMElement();
  });

  test('should render layers', async () => {
    await setup([
      { id: '1', title: 'Layer1', loading: LoadingStateEnum.LOADED, totalCount: 2 },
      { id: '2', title: 'Layer2', loading: LoadingStateEnum.LOADING },
      { id: '3', title: 'Layer3', loading: LoadingStateEnum.FAILED },
      { id: '4', title: 'Layer4', loading: LoadingStateEnum.INITIAL },
      { id: '5', title: 'Layer5', loading: LoadingStateEnum.LOADING },
      { id: '6', title: 'Layer6', loading: LoadingStateEnum.LOADED, totalCount: 4 },
    ]);
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('combobox'));
    expect(await screen.findByText('Layer1 (2)')).toBeInTheDocument();
    expect(await screen.findByText('Layer2')).toBeInTheDocument();
    expect(await screen.findByText('Layer3')).toBeInTheDocument();
    expect(await screen.findByText('Layer4')).toBeInTheDocument();
    expect(await screen.findByText('Layer5')).toBeInTheDocument();
    expect(await screen.findByText('Layer6 (4)')).toBeInTheDocument();
    expect(await screen.findByLabelText('Loading feature info for layer Layer2')).toBeInTheDocument();
    expect(await screen.findByLabelText('Loading feature info for layer Layer5')).toBeInTheDocument();
    expect(await screen.findByLabelText('Feature info loaded for layer Layer1')).toBeInTheDocument();
    expect(await screen.findByLabelText('Feature info loaded for layer Layer6')).toBeInTheDocument();
  });

});
