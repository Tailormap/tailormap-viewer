export type LayerId = string;
export type FeatureTypeName = string | symbol;
export type CQLFilter = string;
export type LayerFeaturesFilters = Map<FeatureTypeName, CQLFilter>;
export type FeaturesFilters = Map<LayerId, LayerFeaturesFilters>;
