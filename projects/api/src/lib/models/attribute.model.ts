import { AttributeType } from './attribute-type.enum';

export interface Attribute {
    id: number;
    featureType: number;
    name: string;
    longname: string;
    editAlias: string;
    type: AttributeType;
    visible: boolean;
    selectable: boolean;
    filterable: boolean;
    folder_label: string;
    editable: boolean;
    defaultValue: string;
    disallowNullValue: boolean;
    disableUserEdit: boolean;
    allowValueListOnly: boolean;
    automaticValue: boolean;
    valueList: string;
    editValues: Array<string | boolean | number>;
}
