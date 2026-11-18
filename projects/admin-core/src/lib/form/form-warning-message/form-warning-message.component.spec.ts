import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { FormFieldTypeEnum } from '@tailormap-viewer/api';
import { FormModel, getAttributeDescriptor, getFeatureType } from '@tailormap-admin/admin-api';
import { FormWarningMessageComponent } from './form-warning-message.component';

const featureType = getFeatureType({
  attributes: [ 'name', 'eindregistratie', 'optalud' ].map(name => getAttributeDescriptor({ id: name, name })),
  settings: { editableAttributes: [ 'name', 'eindregistratie', 'optalud' ] },
});

const form: FormModel = {
  id: 1,
  name: 'form',
  featureSourceId: 1,
  featureTypeName: 'table1',
  options: { columns: 1, tabs: [] },
  fields: [ 'name', 'eindregistratie', 'optalud' ].map(name => ({ name, label: name, type: FormFieldTypeEnum.TEXT })),
};

describe('FormWarningMessageComponent', () => {

  test('shows nothing when the form has no conflicting fields', async () => {
    await render(FormWarningMessageComponent, { inputs: { featureType, form } });
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  test('shows hidden and read-only fields of the application layer separately', async () => {
    await render(FormWarningMessageComponent, {
      inputs: {
        featureType,
        form,
        applicationLayerSetting: { hideAttributes: ['optalud'], readOnlyAttributes: ['eindregistratie'] },
      },
    });
    expect(screen.getByText(/hidden in the catalog or application layer settings/)).toBeInTheDocument();
    expect(screen.getByText(/shown read-only in the viewer/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual([ 'optalud', 'eindregistratie' ]);
  });

});
