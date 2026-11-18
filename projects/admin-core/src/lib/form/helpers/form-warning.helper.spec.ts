import { describe, test, expect } from 'vitest';
import { FormFieldTypeEnum } from '@tailormap-viewer/api';
import { FormModel, getAttributeDescriptor, getFeatureType } from '@tailormap-admin/admin-api';
import { FormWarningHelper } from './form-warning.helper';

const featureType = getFeatureType({
  attributes: [ 'name', 'hidden', 'readonly', 'app_hidden', 'app_readonly' ].map(name => getAttributeDescriptor({ id: name, name })),
  settings: {
    hideAttributes: ['hidden'],
    editableAttributes: [ 'name', 'hidden', 'app_hidden', 'app_readonly' ],
  },
});

const getForm = (fields: FormModel['fields']): FormModel => ({
  id: 1,
  name: 'form',
  featureSourceId: 1,
  featureTypeName: 'table1',
  options: { columns: 1, tabs: [] },
  fields,
});

const field = (name: string, overrides?: Partial<FormModel['fields'][number]>) => ({
  name, label: name, type: FormFieldTypeEnum.TEXT, ...overrides,
});

describe('FormWarningHelper', () => {

  test('returns no warnings without form or feature type', () => {
    expect(FormWarningHelper.hasWarnings(FormWarningHelper.getFieldWarnings(null, featureType))).toBe(false);
    expect(FormWarningHelper.hasWarnings(FormWarningHelper.getFieldWarnings(getForm([field('hidden')]), null))).toBe(false);
  });

  test('warns about hidden and removed attributes using catalog settings only', () => {
    const form = getForm([ field('name'), field('hidden'), field('removed'), field('readonly'), field('app_hidden') ]);
    expect(FormWarningHelper.getFieldWarnings(form, featureType)).toEqual({
      notShown: [ 'hidden', 'removed' ],
      readOnly: ['readonly'],
      requiredReadOnly: [],
    });
  });

  test('includes application layer settings', () => {
    const form = getForm([ field('name'), field('app_hidden'), field('app_readonly') ]);
    const warnings = FormWarningHelper.getFieldWarnings(form, featureType, {
      hideAttributes: ['app_hidden'],
      readOnlyAttributes: ['app_readonly'],
    });
    expect(warnings).toEqual({ notShown: ['app_hidden'], readOnly: ['app_readonly'], requiredReadOnly: [] });
  });

  test('does not warn about a read-only attribute when the form field is disabled too', () => {
    const form = getForm([field('readonly', { disabled: true })]);
    expect(FormWarningHelper.hasWarnings(FormWarningHelper.getFieldWarnings(form, featureType))).toBe(false);
  });

  test('warns about required fields which cannot be edited', () => {
    const form = getForm([
      field('readonly', { required: true }),
      field('name', { required: true, disabled: true }),
      field('app_readonly', { required: true }),
    ]);
    expect(FormWarningHelper.getFieldWarnings(form, featureType).requiredReadOnly).toEqual([ 'readonly', 'name' ]);
  });

});
