import { render, screen } from '@testing-library/angular';
import { FeatureInfoContentComponent } from './feature-info-content.component';
import { LoadingStateEnum, SharedModule } from '@tailormap-viewer/shared';
import { CoreSharedModule } from '../../../shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FeatureInfoModel } from '../models';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { AttachmentService } from '../../../services';

const getFeatureInfo = (updated?: boolean): FeatureInfoModel => {
  return {
    __fid: '1',
    geometry: null,
    layer: getAppLayerModel(),
    sortedAttachmentsByAttribute: [],
    attachmentCount: 0,
    sortedAttributes: [
      { key: 'prop', attributeValue: 'test', label: 'Property' },
      { key: 'prop2', attributeValue: 'another test', label: 'Property 2' },
      { key: 'fid', attributeValue: updated ? '6' : '1', label: 'fid' },
    ],
  };
};

describe('FeatureInfoContentComponent', () => {

  test('should render', async () => {
    const mockAttachmentService = {
      getAttachmentUrl: () => '',
      getAttachmentTooltip: () => '',
    };
    await render(FeatureInfoContentComponent, {
      imports: [
        SharedModule,
        CoreSharedModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: AttachmentService, useValue: mockAttachmentService },
      ],
      inputs: {
        selectedLayer: { id: '1', title: 'Layer1', loading: LoadingStateEnum.LOADED },
        currentFeature: getFeatureInfo(),
        isPrevButtonDisabled: false,
        isNextButtonDisabled: false,
        isEditPossible: true,
      },
    });
    expect((await screen.findByText(/fid/)).nextSibling?.textContent?.trim()).toEqual('1');
    expect((await screen.findByText(/Property 2/)).nextSibling?.textContent?.trim()).toEqual('another test');
  });

});
