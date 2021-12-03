import { GeometryType } from './geometry-type.enum';
import { LayerRelation } from './layer-relation.model';
import { Attribute } from './attribute.model';

export interface LayerDetails {
    id: number;
    featuretypeName: string;
    serviceId: number;
    geometryAttribute: string;
    geometryAttributeIndex: number;
    geometryType: GeometryType;
    editable: boolean;
    metadata: string | null;
    relations: LayerRelation[];
    attributes: Attribute[];
}
