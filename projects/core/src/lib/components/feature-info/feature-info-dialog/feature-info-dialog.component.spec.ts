import { render, screen } from '@testing-library/angular';
import { FeatureInfoDialogComponent } from './feature-info-dialog.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { featureInfoStateKey, initialFeatureInfoState } from '../state/feature-info.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { selectFeatureInfo, selectFeatureInfoDialogVisible } from '../state/feature-info.selectors';
import { FeatureInfoModel } from '../models/feature-info.model';
import { getAppLayerModel, getColumnMetadataModel } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { TestBed } from '@angular/core/testing';

const getFeatureInfo = (updated?: boolean): FeatureInfoModel[] => {
  return [
    {
      features: ['1', '2', '3', '4', '5']
        .map(id => updated ? `${+(id) + 5}` : id)
        .map(id => ({ __fid: id, attributes: { prop: 'test', prop2: 'another test', fid: id } })),
      columnMetadata: [ getColumnMetadataModel(), getColumnMetadataModel({ key: 'prop2', alias: 'Property 2' }) ],
      layer: getAppLayerModel(),
    },
  ];
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
          { selector: selectFeatureInfo, value: getFeatureInfo() },
          { selector: selectFeatureInfoDialogVisible, value: true },
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
    (await screen.findByText(/Next/)).click();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('2');
    (await screen.findByText(/Back/)).click();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
  });

  test('updates feature info when state changes', async () => {
    await renderWithState();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectFeatureInfo, getFeatureInfo(true));
    store.refreshState();
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('6');
  });

});
