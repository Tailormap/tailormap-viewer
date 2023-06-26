import { AttributeType } from './attribute-type.enum';

export interface AttributeModel {
    id: number;
    featureType: number;
    key: string;
    type: AttributeType;
    filterable: boolean;
    editable: boolean;
    editAlias?: string;
    defaultValue?:  string|number|boolean;
    nullable: boolean;
    automaticValue: boolean;
    valueList?: string|number|boolean
    allowValueListOnly: boolean;
}
