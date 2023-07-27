import { GeometryType } from './geometry-type.enum';
import { AttributeModel } from './attribute.model';

export interface LayerDetailsModel {
    id: string;
    featureTypeName: string;
    serviceId: number;
    geometryAttribute: string;
    geometryAttributeIndex: number;
    geometryType: GeometryType;
    editable: boolean;
    attributes: AttributeModel[];
}
