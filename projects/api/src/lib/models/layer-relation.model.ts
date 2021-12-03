import { RelationType } from './relation-type.enum';

export interface LayerRelation {
    featureType: number;
    foreignFeatureType: number;
    type: RelationType;
}
