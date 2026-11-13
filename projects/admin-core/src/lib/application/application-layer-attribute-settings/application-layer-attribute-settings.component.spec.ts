import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppLayerSettingsModel, FeatureTypeModel, getAttributeDescriptor, getFeatureType } from '@tailormap-admin/admin-api';
import { ApplicationLayerAttributeSettingsComponent } from './application-layer-attribute-settings.component';

const setup = async (featureTypeOverrides: Partial<FeatureTypeModel>, appLayerSettings: AppLayerSettingsModel) => {
  const closeFn = vi.fn();
  const featureType = getFeatureType({
    attributes: [
      getAttributeDescriptor({ id: 'att1', name: 'att1' }),
      getAttributeDescriptor({ id: 'att2', name: 'att2' }),
    ],
    settings: { editableAttributes: [ 'att1', 'att2' ] },
    ...featureTypeOverrides,
  });
  await render(ApplicationLayerAttributeSettingsComponent, {
    providers: [
      { provide: MatDialogRef, useValue: { close: closeFn } },
      { provide: MAT_DIALOG_DATA, useValue: { featureType, appLayerSettings } },
    ],
  });
  return { closeFn };
};

/** Returns the checkboxes in the row of the given attribute: [enabled, editable?]. */
const getRowCheckboxes = (attribute: string) => {
  const row = screen.getByText(attribute).closest('mat-row');
  return Array.from(row?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') || []);
};

describe('ApplicationLayerAttributeSettingsComponent', () => {

  test('shows editable column with app layer read-only attributes unchecked for writeable feature type', async () => {
    await setup({ writeable: true }, { readOnlyAttributes: ['att2'] });
    expect(screen.getByText('Editable')).toBeInTheDocument();
    const [ att1Enabled, att1Editable ] = getRowCheckboxes('att1');
    const [ att2Enabled, att2Editable ] = getRowCheckboxes('att2');
    expect(att1Enabled).toBeChecked();
    expect(att1Editable).toBeChecked();
    expect(att2Enabled).toBeChecked();
    expect(att2Editable).not.toBeChecked();
    // Attachment attributes are configured in the catalog only
    expect(screen.queryByText('Attachment attributes')).not.toBeInTheDocument();
  });

  test('does not show editable column for non-writeable feature type', async () => {
    await setup({ writeable: false }, {});
    expect(screen.queryByText('Editable')).not.toBeInTheDocument();
    expect(getRowCheckboxes('att1')).toHaveLength(1);
  });

  test('toggling editable updates read-only attributes on save', async () => {
    const { closeFn } = await setup({ writeable: true }, { readOnlyAttributes: ['att2'] });
    await userEvent.click(getRowCheckboxes('att1')[1]);
    await userEvent.click(getRowCheckboxes('att2')[1]);
    await userEvent.click(screen.getByText('Save'));
    expect(closeFn).toHaveBeenCalledWith({ hideAttributes: [], readOnlyAttributes: ['att1'] });
  });

});
