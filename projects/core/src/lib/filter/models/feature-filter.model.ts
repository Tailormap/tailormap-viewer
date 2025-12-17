export type LayerId = string;
export type FeatureTypeName = string;
export type CQLFilter = string;
export type LayerFeaturesFilters = Map<FeatureTypeName, CQLFilter>;
export type FeaturesFilters = Map<LayerId, LayerFeaturesFilters>;
