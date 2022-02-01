import { render, screen } from '@testing-library/angular';
import { FeatureInfoDialogComponent } from './feature-info-dialog.component';
import { provideMockStore } from '@ngrx/store/testing';
import { featureInfoStateKey, initialFeatureInfoState } from '../state/feature-info.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { selectFeatureInfo, selectFeatureInfoDialogVisible } from '../state/feature-info.selectors';
import { FeatureInfoModel } from '../models/feature-info.model';
import { getAppLayerModel, getColumnMetadataModel, getFeatureModel, getFeaturesResponseModel } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const getFeatureInfo = (): FeatureInfoModel[] => {
  return [
    {
      features: ['1', '2', '3', '4', '5'].map(id => ({ __fid: id, attributes: { prop: 'test', prop2: 'another test', fid: id } })),
      columnMetadata: [ getColumnMetadataModel(), getColumnMetadataModel({ key: 'prop2', alias: 'Property 2' }) ],
      layer: getAppLayerModel(),
    },
  ];
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
            { selector: selectFeatureInfo, value: getFeatureInfo() },
            { selector: selectFeatureInfoDialogVisible, value: true },
          ],
        }),
      ],
    });
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
    expect((await screen.findByText(/Property 2/)).nextSibling?.textContent?.trim()).toEqual('another test');
    (await screen.findByText(/Next/)).click();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('2');
    (await screen.findByText(/Back/)).click();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
  });

});
