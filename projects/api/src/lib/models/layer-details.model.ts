import { GeometryType } from './geometry-type.enum';
import { AttributeModel } from './attribute.model';
import { FormOptionsModel } from './form-options.model';
import { FormFieldModel } from './form-field.model';

export interface LayerDetailsModel {
    id: string;
    featureTypeName: string;
    serviceId: number;
    geometryAttribute: string;
    geometryAttributeIndex: number;
    geometryType: GeometryType;
    editable: boolean;
    form?: { options: FormOptionsModel; fields: FormFieldModel[] } | null;
    attributes: AttributeModel[];
}
