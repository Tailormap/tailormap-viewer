import { describe, test, expect } from 'vitest';
import {
  AttributeModel, AttributeType, ChoiceListSourceEnum, FormFieldModel, FormFieldControlTypeEnum, getFeatureModel, getLayerDetailsModel, LayerDetailsModel,
} from '@tailormap-viewer/api';
import { EditModelHelper } from './edit-model.helper';

const getAttribute = (overrides: Partial<AttributeModel>): AttributeModel => ({
  id: 1,
  name: 'attr',
  type: AttributeType.STRING,
  editable: true,
  nullable: true,
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
  form: formFields ? { options: { tabs: [] }, fields: formFields } : null,
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
    expect(getField(layerDetails, 'name')).toEqual(expect.objectContaining({ controlType: FormFieldControlTypeEnum.TEXT, readOnly: false, required: false }));
    expect(getField(layerDetails, 'creationdate')).toEqual(expect.objectContaining({ controlType: FormFieldControlTypeEnum.DATE, required: true }));
    expect(getField(layerDetails, 'eindregistratie')).toEqual(expect.objectContaining({ controlType: FormFieldControlTypeEnum.DATETIME, readOnly: true }));
  });

  test('form field cannot make a non-editable attribute editable', () => {
    const layerDetails = getLayerDetails([
      { name: 'eindregistratie', label: 'Eindregistratie', controlType: FormFieldControlTypeEnum.DATETIME },
    ]);
    expect(getField(layerDetails, 'eindregistratie')).toEqual(expect.objectContaining({ label: 'Eindregistratie', readOnly: true }));
  });

  test('form field can make an editable attribute read-only', () => {
    const layerDetails = getLayerDetails([
      { name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.TEXT, readOnly: true },
    ]);
    expect(getField(layerDetails, 'name')?.readOnly).toBe(true);
  });

  test('uses a number control for an integer attribute and keeps the attribute type for validation', () => {
    const layerDetails = getLayerDetailsModel({
      editable: true,
      attributes: [getAttribute({ name: 'count', type: AttributeType.INTEGER })],
      form: null,
    });
    const fields = EditModelHelper.createEditModel(getFeatureModel({ attributes: { count: 1 } }), layerDetails, []);
    expect(fields[0]).toEqual(expect.objectContaining({ controlType: FormFieldControlTypeEnum.NUMBER, attributeType: AttributeType.INTEGER }));
  });

  test('form field cannot make a non-nullable attribute optional', () => {
    const layerDetails = getLayerDetails([
      { name: 'creationdate', label: 'Created', controlType: FormFieldControlTypeEnum.DATE, required: false },
    ]);
    expect(getField(layerDetails, 'creationdate')?.required).toBe(true);
  });

  test('ignores a form field control which is incompatible with the attribute type', () => {
    const layerDetails = getLayerDetails([
      { name: 'creationdate', label: 'Created', controlType: FormFieldControlTypeEnum.TEXT },
      { name: 'eindregistratie', label: 'Ended', controlType: FormFieldControlTypeEnum.TEXT },
    ]);
    expect(getField(layerDetails, 'creationdate')).toEqual(expect.objectContaining({ label: 'Created', controlType: FormFieldControlTypeEnum.DATE }));
    expect(getField(layerDetails, 'eindregistratie')?.controlType).toBe(FormFieldControlTypeEnum.DATETIME);
  });

  test('uses a compatible form field control and its choice list', () => {
    const layerDetails = getLayerDetails([
      {
        name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.SELECT,
        choiceList: { source: ChoiceListSourceEnum.LIST, values: [{ value: 'a' }, { value: 'b', label: 'B' }], allowFreeInput: true },
      },
    ]);
    expect(getField(layerDetails, 'name')).toEqual(expect.objectContaining({
      controlType: FormFieldControlTypeEnum.SELECT,
      choiceList: { source: ChoiceListSourceEnum.LIST, values: [{ value: 'a', label: 'a' }, { value: 'b', label: 'B' }], allowFreeInput: true },
    }));
  });

  test('keeps the unique values source of a choice list', () => {
    const layerDetails = getLayerDetails([
      { name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.SELECT, choiceList: { source: ChoiceListSourceEnum.UNIQUE_VALUES } },
    ]);
    expect(getField(layerDetails, 'name')?.choiceList).toEqual({ source: ChoiceListSourceEnum.UNIQUE_VALUES, values: [] });
  });

  test('uses a choice list for a boolean attribute which is not nullable', () => {
    const layerDetails = getLayerDetailsModel({
      editable: true,
      attributes: [getAttribute({ name: 'flag', type: AttributeType.BOOLEAN, nullable: false })],
    });
    expect(getField(layerDetails, 'flag')).toEqual(expect.objectContaining({
      controlType: FormFieldControlTypeEnum.SELECT,
      choiceList: { source: ChoiceListSourceEnum.LIST, values: [{ value: true, label: 'True' }, { value: false, label: 'False' }] },
    }));
  });

  test('only includes and orders attributes in the form', () => {
    const layerDetails = getLayerDetails([
      { name: 'creationdate', label: 'Created', controlType: FormFieldControlTypeEnum.DATE },
      { name: 'name', label: 'Name', controlType: FormFieldControlTypeEnum.TEXT },
    ]);
    expect(EditModelHelper.createEditModel(feature, layerDetails, []).map(f => f.name)).toEqual([ 'creationdate', 'name' ]);
  });

  test('leaves out choice list values which cannot be parsed to the attribute type', () => {
    const layerDetails = getLayerDetailsModel({
      editable: true,
      attributes: [
        getAttribute({ name: 'count', type: AttributeType.INTEGER }),
        getAttribute({ name: 'flag', type: AttributeType.BOOLEAN }),
      ],
      form: {
        options: { tabs: [] },
        fields: [
          { name: 'count', label: 'Count', controlType: FormFieldControlTypeEnum.SELECT,
            choiceList: { source: ChoiceListSourceEnum.LIST, values: [{ value: '1' }, { value: 'abc' }, { value: '' }, { value: '2' }] } },
          { name: 'flag', label: 'Flag', controlType: FormFieldControlTypeEnum.SELECT,
            choiceList: { source: ChoiceListSourceEnum.LIST, values: [{ value: 'true' }, { value: 'yes' }, { value: 'false', label: 'No' }] } },
        ],
      },
    });
    expect(getField(layerDetails, 'count')?.choiceList?.values).toEqual([{ value: 1, label: '1' }, { value: 2, label: '2' }]);
    expect(getField(layerDetails, 'flag')?.choiceList?.values).toEqual([{ value: true, label: 'true' }, { value: false, label: 'No' }]);
  });

  test('an editable primary key is only editable for a new feature', () => {
    const layerDetails = getLayerDetailsModel({
      editable: true,
      attributes: [getAttribute({ name: 'id', type: AttributeType.INTEGER, primaryKey: true, nullable: false })],
      form: null,
    });
    const getIdField = (isNewFeature: boolean) => EditModelHelper.createEditModel(feature, layerDetails, [], isNewFeature).find(f => f.name === 'id');
    expect(getIdField(true)?.readOnly).toBe(false);
    expect(getIdField(false)?.readOnly).toBe(true);
  });

  test('form field cannot make the primary key of an existing feature editable', () => {
    const layerDetails = getLayerDetailsModel({
      editable: true,
      attributes: [getAttribute({ name: 'id', type: AttributeType.INTEGER, primaryKey: true })],
      form: { options: { tabs: [] }, fields: [{ name: 'id', label: 'ID', controlType: FormFieldControlTypeEnum.NUMBER }] },
    });
    expect(EditModelHelper.createEditModel(feature, layerDetails, [], false).find(f => f.name === 'id')?.readOnly).toBe(true);
    expect(EditModelHelper.createEditModel(feature, layerDetails, [], true).find(f => f.name === 'id')?.readOnly).toBe(false);
  });

});
