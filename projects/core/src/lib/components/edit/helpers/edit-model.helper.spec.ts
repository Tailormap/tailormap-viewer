import { describe, test, expect } from 'vitest';
import {
  AttributeModel, AttributeType, FormFieldModel, FormFieldTypeEnum, getFeatureModel, getLayerDetailsModel, LayerDetailsModel,
} from '@tailormap-viewer/api';
import { EditModelHelper } from './edit-model.helper';

const getAttribute = (overrides: Partial<AttributeModel>): AttributeModel => ({
  id: 1,
  name: 'attr',
  type: AttributeType.STRING,
  editable: true,
  nullable: true,
  allowValueListOnly: false,
  ...overrides,
});

const attributes: AttributeModel[] = [
  getAttribute({ name: 'name', type: AttributeType.STRING }),
  getAttribute({ name: 'creationdate', type: AttributeType.DATE, nullable: false }),
  getAttribute({ name: 'eindregistratie', type: AttributeType.TIMESTAMP, editable: false }),
];

const getLayerDetails = (formFields?: FormFieldModel[]): LayerDetailsModel => getLayerDetailsModel({
  editable: true,
  attributes,
  form: formFields ? { options: { columns: 1, tabs: [] }, fields: formFields } : null,
});

const feature = getFeatureModel({
  attributes: { name: 'test', creationdate: '2026-01-01', eindregistratie: '2026-01-01T00:00:00Z' },
});

const getField = (layerDetails: LayerDetailsModel, name: string) => {
  return EditModelHelper.createEditModel(feature, layerDetails, []).find(f => f.name === name);
};

describe('EditModelHelper', () => {

  test('creates fields from attributes without a form', () => {
    const layerDetails = getLayerDetails();
    expect(getField(layerDetails, 'name')).toEqual(expect.objectContaining({ type: FormFieldTypeEnum.TEXT, disabled: false, required: false }));
    expect(getField(layerDetails, 'creationdate')).toEqual(expect.objectContaining({ type: FormFieldTypeEnum.DATE, required: true }));
    expect(getField(layerDetails, 'eindregistratie')).toEqual(expect.objectContaining({ type: FormFieldTypeEnum.TIMESTAMP, disabled: true }));
  });

  test('form field cannot make a non-editable attribute editable', () => {
    const layerDetails = getLayerDetails([
      { name: 'eindregistratie', label: 'Eindregistratie', type: FormFieldTypeEnum.TIMESTAMP },
    ]);
    expect(getField(layerDetails, 'eindregistratie')).toEqual(expect.objectContaining({ label: 'Eindregistratie', disabled: true }));
  });

  test('form field can make an editable attribute read-only', () => {
    const layerDetails = getLayerDetails([
      { name: 'name', label: 'Name', type: FormFieldTypeEnum.TEXT, disabled: true },
    ]);
    expect(getField(layerDetails, 'name')?.disabled).toBe(true);
  });

  test('form field cannot make a non-nullable attribute optional', () => {
    const layerDetails = getLayerDetails([
      { name: 'creationdate', label: 'Created', type: FormFieldTypeEnum.DATE, required: false },
    ]);
    expect(getField(layerDetails, 'creationdate')?.required).toBe(true);
  });

  test('ignores a form field type which is incompatible with the attribute type', () => {
    const layerDetails = getLayerDetails([
      { name: 'creationdate', label: 'Created', type: FormFieldTypeEnum.TEXT },
      { name: 'eindregistratie', label: 'Ended', type: FormFieldTypeEnum.TEXT },
    ]);
    expect(getField(layerDetails, 'creationdate')).toEqual(expect.objectContaining({ label: 'Created', type: FormFieldTypeEnum.DATE }));
    expect(getField(layerDetails, 'eindregistratie')?.type).toBe(FormFieldTypeEnum.TIMESTAMP);
  });

  test('uses a compatible form field type and its value list', () => {
    const layerDetails = getLayerDetails([
      { name: 'name', label: 'Name', type: FormFieldTypeEnum.SELECT, valueList: [{ value: 'a' }, { value: 'b', label: 'B' }] },
    ]);
    expect(getField(layerDetails, 'name')).toEqual(expect.objectContaining({
      type: FormFieldTypeEnum.SELECT,
      valueList: [{ value: 'a', label: 'a' }, { value: 'b', label: 'B' }],
    }));
  });

  test('only includes and orders attributes in the form', () => {
    const layerDetails = getLayerDetails([
      { name: 'creationdate', label: 'Created', type: FormFieldTypeEnum.DATE },
      { name: 'name', label: 'Name', type: FormFieldTypeEnum.TEXT },
    ]);
    expect(EditModelHelper.createEditModel(feature, layerDetails, []).map(f => f.name)).toEqual([ 'creationdate', 'name' ]);
  });

  test('leaves out value list items which cannot be parsed to the attribute type', () => {
    const layerDetails = getLayerDetailsModel({
      editable: true,
      attributes: [
        getAttribute({ name: 'count', type: AttributeType.INTEGER }),
        getAttribute({ name: 'flag', type: AttributeType.BOOLEAN }),
      ],
      form: {
        options: { columns: 1, tabs: [] },
        fields: [
          { name: 'count', label: 'Count', type: FormFieldTypeEnum.SELECT, valueList: [{ value: '1' }, { value: 'abc' }, { value: '' }, { value: 2 }] },
          { name: 'flag', label: 'Flag', type: FormFieldTypeEnum.SELECT, valueList: [{ value: 'true' }, { value: 'yes' }, { value: 'false', label: 'No' }] },
        ],
      },
    });
    expect(getField(layerDetails, 'count')?.valueList).toEqual([{ value: 1, label: '1' }, { value: 2, label: '2' }]);
    expect(getField(layerDetails, 'flag')?.valueList).toEqual([{ value: true, label: 'true' }, { value: false, label: 'No' }]);
  });

});
