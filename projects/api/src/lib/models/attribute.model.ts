import { AttributeType } from './attribute-type.enum';

export interface AttributeModel {
    featureType: number;
    name: string;
    alias?: string;
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
