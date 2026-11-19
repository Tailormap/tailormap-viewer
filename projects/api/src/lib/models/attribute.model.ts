import { AttributeType } from './attribute-type.enum';

export interface AttributeModel {
    id: number;
    name: string;
    alias?: string | null;
    type: AttributeType;
    /** For the primary key attribute this only applies to new features, see `primaryKey`. */
    editable: boolean;
    /** Whether this is the primary key attribute. The primary key of an existing feature can't be changed. */
    primaryKey?: boolean;
    editAlias?: string;
    // may need to be coerced to proper type
    defaultValue?: string;
    nullable: boolean | null;
}
