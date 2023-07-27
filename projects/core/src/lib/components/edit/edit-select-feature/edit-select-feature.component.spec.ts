import { render, screen } from '@testing-library/angular';
import { EditSelectFeatureComponent } from './edit-select-feature.component';
import { getFeatureModel } from "@tailormap-viewer/api";
import { FeatureInfoFeatureModel } from "../../feature-info/models/feature-info-feature.model";
import { MapService } from "@tailormap-viewer/map";
import { of } from "rxjs";
import { Store } from "@ngrx/store";
import userEvent from "@testing-library/user-event";
import { setSelectedEditFeature } from "../state/edit.actions";

const features: FeatureInfoFeatureModel[] = [
  { layerId: '1', ...getFeatureModel(), __fid: 'feature-1' },
  { layerId: '1', ...getFeatureModel(), __fid: 'feature-2' },
  { layerId: '1', ...getFeatureModel(), __fid: 'feature-3' },
];

describe('EditSelectFeatureComponent', () => {

  test('should render', async () => {
    const renderFeatureMock = jest.fn(() => of(true));
    const dispatchMock = jest.fn();
    await render(EditSelectFeatureComponent, {
      providers: [
        { provide: MapService, useValue: { renderFeatures$: renderFeatureMock } },
        { provide: Store, useValue: { dispatch: dispatchMock } },
      ],
      componentInputs: {
        features,
      },
    });
    expect(await screen.findByText('Feature 1'));
    expect(await screen.findByText('Feature 2'));
    expect(await screen.findByText('Feature 3'));
    await userEvent.click(await screen.findByText('Feature 2'));
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(setSelectedEditFeature({ fid: 'feature-2' }));
  });

});
