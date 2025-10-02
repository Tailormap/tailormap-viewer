import { render, screen } from '@testing-library/angular';
import { EditDialogComponent } from './edit-dialog.component';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AttributeType, getAppLayerModel, getFeatureModel, UniqueValuesService } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { editStateKey, initialEditState } from '../state/edit.state';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { EditFeatureService } from '../services/edit-feature.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectEditDialogVisible, selectSelectedEditFeature } from '../state/edit.selectors';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';
import { of } from 'rxjs';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';
import { CoreSharedModule } from '../../../shared';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const getFeatureInfo = (): FeatureWithMetadataModel => {
  return {
    feature: { ...getFeatureModel(), layerId: '1' },
    columnMetadata: [
      { layerId: '1', name: 'prop', alias: 'Property', type: AttributeType.STRING },
      { layerId: '1', name: 'prop2', alias: 'Property 2', type: AttributeType.STRING },
      { layerId: '1', name: 'fid', alias: 'fid', type: AttributeType.STRING },
    ],
  };
};

const setup = async (getLayerDetails = false, selectors: any[] = []) => {
  const { container } = await render(EditDialogComponent, {
    imports: [
      SharedModule,
      NoopAnimationsModule,
      MatIconTestingModule,
      CoreSharedModule,
    ],
    providers: [
      {
        provide: ApplicationLayerService,
        useValue: getLayerDetails ? { getLayerDetails$: () => of(({ layer: getAppLayerModel(), details: {} })) } : {},
      },
      { provide: EditFeatureService, useValue: {} },
      getMapServiceMock().provider,
      provideMockStore({ initialState: { [editStateKey]: { ...initialEditState } }, selectors }),
      { provide: UniqueValuesService, useValue: { clearCaches: jest.fn() } },
      { provide: ViewerLayoutService, useValue: { setLeftPadding: jest.fn(), setRightPadding: jest.fn() } },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  });
  return { container };
};

describe('EditDialogComponent', () => {

  test('runs without feature info', async () => {
    const { container } = await setup();
    expect(container.querySelector('.edit-form')).toBeNull();
  });

  test('shows edit dialog', async () => {
    await setup(true, [
      { selector: selectSelectedEditFeature, value: getFeatureInfo() },
      { selector: selectEditDialogVisible, value: true },
    ]);
    expect(await screen.findByText('Edit')).toBeInTheDocument();
    expect(await screen.findByText('Close')).toBeInTheDocument();
    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(await screen.findByText('Delete')).toBeInTheDocument();
  });

});
