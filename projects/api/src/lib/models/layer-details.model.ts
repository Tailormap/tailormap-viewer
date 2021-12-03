import { GeometryType } from './geometry-type.enum';
import { LayerRelationModel } from './layer-relation.model';
import { AttributeModel } from './attribute.model';

export interface LayerDetailsModel {
    id: number;
    featuretypeName: string;
    serviceId: number;
    geometryAttribute: string;
    geometryAttributeIndex: number;
    geometryType: GeometryType;
    editable: boolean;
    metadata: string | null;
    relations: LayerRelationModel[];
    attributes: AttributeModel[];
}
