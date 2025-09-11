import { AttributeType } from './attribute-type.enum';

export interface AttributeModel {
    id: number;
    featureType: number;
    name: string;
    title?: string | null;
    type: AttributeType;
    editable: boolean;
    editAlias?: string;
    // may need to be coerced to proper type
    defaultValue?: string;
    nullable: boolean | null;
    // values may need to be coerced to proper type
    valueList?: string;
    allowValueListOnly: boolean;
}
