import { render, screen } from '@testing-library/angular';
import { FeatureInfoContentComponent } from './feature-info-content.component';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FeatureInfoModel } from '../models';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { AttachmentService } from '../../../services';
import { of } from 'rxjs';
import { FeatureSelectionBookmarkService } from '../../../services/application-bookmark/feature-selection-bookmark.service';
import { provideMockStore } from '@ngrx/store/testing';
import { selectFeatureInfoMetadata } from '../state/feature-info.selectors';
import { selectActiveFilterGroups, selectAllFilterGroupsForLayerId, selectAllFiltersForAttribute } from '../../../state';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';

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
    const mockFeatureSelectionBookmarkService = { getFidSelectionUrl$: () => of(null) };
    const mockSimpleAttributeFilterService = { setFilter: vi.fn(), removeFilterById: vi.fn() };
    await render(FeatureInfoContentComponent, {
      imports: [
        MatIconTestingModule,
      ],
      providers: [
        { provide: AttachmentService, useValue: mockAttachmentService },
        { provide: FeatureSelectionBookmarkService, useValue: mockFeatureSelectionBookmarkService },
        { provide: SimpleAttributeFilterService, useValue: mockSimpleAttributeFilterService },
        provideMockStore({
          selectors: [
            { selector: selectFeatureInfoMetadata, value: { columnMetadata: [], attachmentMetadata: [] } },
            { selector: selectAllFilterGroupsForLayerId('1'), value: [] },
            { selector: selectAllFiltersForAttribute('1', 'prop'), value: [] },
            { selector: selectAllFiltersForAttribute('1', 'prop2'), value: [] },
            { selector: selectAllFiltersForAttribute('1', 'fid'), value: [] },
            { selector: selectActiveFilterGroups, value: [] },
          ],
        }),
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
