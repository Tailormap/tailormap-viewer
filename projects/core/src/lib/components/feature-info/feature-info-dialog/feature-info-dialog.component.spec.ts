import { render, screen, waitFor } from '@testing-library/angular';
import { FeatureInfoDialogComponent } from './feature-info-dialog.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { featureInfoStateKey, initialFeatureInfoState } from '../state/feature-info.state';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  selectCurrentlySelectedFeature, selectFeatureInfoDialogVisible, selectIsNextButtonDisabled,
  selectIsPrevButtonDisabled, selectSelectedFeatureInfoLayer,
} from '../state/feature-info.selectors';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { TestBed } from '@angular/core/testing';
import { FeatureInfoModel } from '../models/feature-info.model';
import { showNextFeatureInfoFeature, showPreviousFeatureInfoFeature } from '../state/feature-info.actions';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';
import { CoreSharedModule } from '../../../shared';
import { FeatureInfoLayerListComponent } from '../feature-info-layer-list/feature-info-layer-list.component';

const getFeatureInfo = (updated?: boolean): FeatureInfoModel => {
  return {
    __fid: '1',
    geometry: null,
    layer: getAppLayerModel(),
    sortedAttributes: [
      { key: 'prop', attributeValue: 'test', label: 'Property' },
      { key: 'prop2', attributeValue: 'another test', label: 'Property 2' },
      { key: 'fid', attributeValue: updated ? '6' : '1', label: 'fid' },
    ],
  };
};

const setup = async (withState = false) => {
  return await render(FeatureInfoDialogComponent, {
    imports: [
      SharedModule,
      CoreSharedModule,
      NoopAnimationsModule,
      MatIconTestingModule,
    ],
    declarations: [FeatureInfoLayerListComponent],
    providers: [
      { provide: ViewerLayoutService, useValue: { setLeftPadding: jest.fn(), setRightPadding: jest.fn() } },
      provideMockStore({
        initialState: { [featureInfoStateKey]: { ...initialFeatureInfoState } },
        selectors: withState ? [
          { selector: selectSelectedFeatureInfoLayer, value: { id: '1', title: 'test', loading: LoadingStateEnum.LOADED } },
          { selector: selectCurrentlySelectedFeature, value: getFeatureInfo() },
          { selector: selectCurrentlySelectedFeature, value: getFeatureInfo() },
          { selector: selectFeatureInfoDialogVisible, value: true },
          { selector: selectIsPrevButtonDisabled, value: false },
          { selector: selectIsNextButtonDisabled, value: false },
        ] : [],
      }),
    ],
  });
};

describe('FeatureInfoDialogComponent', () => {

  test('runs without feature info', async () => {
    const { container } = await setup();
    expect(container.querySelector('.feature-info')).toBeNull();
  });

  test('shows feature info', async () => {
    await setup(true);
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
    expect((await screen.findByText(/Property 2/)).nextSibling?.textContent?.trim()).toEqual('another test');
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    (await screen.findByText(/Next/)).click();
    expect(store.dispatch).toHaveBeenCalledWith({ type: showNextFeatureInfoFeature.type });
    (await screen.findByText(/Back/)).click();
    expect(store.dispatch).toHaveBeenCalledWith({ type: showPreviousFeatureInfoFeature.type });
  });

  test('updates feature info when state changes', async () => {
    await setup(true);
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentlySelectedFeature, getFeatureInfo(true));
    store.refreshState();
    await waitFor(() => {
      expect((screen.getByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('6');
    });
  });

});
