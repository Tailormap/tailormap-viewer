import { RelationType } from './relation-type.enum';

export interface LayerRelationModel {
    featureType: number;
    foreignFeatureType: number;
    type: RelationType;
}
