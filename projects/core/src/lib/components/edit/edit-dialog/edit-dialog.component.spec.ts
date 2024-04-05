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

const getFeatureInfo = (): FeatureWithMetadataModel => {
  return {
    feature: { ...getFeatureModel(), layerId: '1' },
    columnMetadata: [
      { layerId: '1', key: 'prop', alias: 'Property', type: AttributeType.STRING },
      { layerId: '1', key: 'prop2', alias: 'Property 2', type: AttributeType.STRING },
      { layerId: '1', key: 'fid', alias: 'fid', type: AttributeType.STRING },
    ],
  };
};

describe('EditDialogComponent', () => {

  test('runs without feature info', async () => {
    const { container } = await render(EditDialogComponent, {
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: ApplicationLayerService, useValue: {} },
        { provide: EditFeatureService, useValue: {} },
        provideMockStore({ initialState: { [editStateKey]: { ...initialEditState } } }),
        { provide: UniqueValuesService, useValue: { clearCaches: jest.fn() } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    expect(container.querySelector('.edit-form')).toBeNull();
  });

  test('shows edit dialog', async () => {
    await render(EditDialogComponent, {
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ApplicationLayerService, useValue: { getLayerDetails$: () => of(({ layer: getAppLayerModel(), details: {} })) } },
        { provide: EditFeatureService, useValue: {} },
        { provide: UniqueValuesService, useValue: { clearCaches: jest.fn() } },
        provideMockStore({
          initialState: { [editStateKey]: { ...initialEditState } },
          selectors: [
            { selector: selectSelectedEditFeature, value: getFeatureInfo() },
            { selector: selectEditDialogVisible, value: true },
          ],
        }),
      ],
    });
    expect(await screen.findByText('Edit')).toBeInTheDocument();
    expect(await screen.findByText('Close')).toBeInTheDocument();
    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(await screen.findByText('Delete')).toBeInTheDocument();
  });

});
