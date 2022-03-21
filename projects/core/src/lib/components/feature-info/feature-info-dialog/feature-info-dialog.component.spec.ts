import { render, screen } from '@testing-library/angular';
import { FeatureInfoDialogComponent } from './feature-info-dialog.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { featureInfoStateKey, initialFeatureInfoState } from '../state/feature-info.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { selectCurrentlySelectedFeature, selectFeatureInfoCounts, selectFeatureInfoDialogVisible } from '../state/feature-info.selectors';
import { getAppLayerModel, getColumnMetadataModel } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { TestBed } from '@angular/core/testing';
import { FeatureInfoModel } from '../models/feature-info.model';
import { showNextFeatureInfoFeature, showPreviousFeatureInfoFeature } from '../state/feature-info.actions';

const getFeatureInfo = (updated?: boolean): FeatureInfoModel => {
  const col1 = getColumnMetadataModel();
  const col2 = getColumnMetadataModel({key: 'prop2', alias: 'Property 2'});
  return {
    feature: {__fid: updated ? '6' : '1', attributes: {prop: 'test', prop2: 'another test', fid: updated ? '6' : '1'}},
    columnMetadata: new Map([[col1.key, col1], [col2.key, col2]]),
    layer: getAppLayerModel(),
  };
};

const renderWithState = async () => {
  await render(FeatureInfoDialogComponent, {
    imports: [
      SharedModule,
      NoopAnimationsModule,
      MatIconTestingModule,
    ],
    providers: [
      provideMockStore({
        initialState: {[featureInfoStateKey]: {...initialFeatureInfoState}},
        selectors: [
          { selector: selectCurrentlySelectedFeature, value: getFeatureInfo() },
          { selector: selectFeatureInfoDialogVisible, value: true },
          { selector: selectFeatureInfoCounts, value: { total: 1, current: 0 }},
        ],
      }),
    ],
  });
};

describe('FeatureInfoDialogComponent', () => {

  test('runs without feature info', async () => {
    const {container} = await render(FeatureInfoDialogComponent, {
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        provideMockStore({initialState: {[featureInfoStateKey]: {...initialFeatureInfoState}}}),
      ],
    });
    expect(container.querySelector('.feature-info')).toBeNull();
  });

  test('shows feature info', async () => {
    await renderWithState();
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
    await renderWithState();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentlySelectedFeature, getFeatureInfo(true));
    store.refreshState();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('6');
  });

});
