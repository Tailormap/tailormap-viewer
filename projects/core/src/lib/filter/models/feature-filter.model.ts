export type LayerId = string;

export type FeatureTypeName = string | symbol;

export type CQLFilter = string;

/**
 * Groups CQL filters by feature type for a single layer.
 * Maps feature type names to their corresponding CQL filter expressions.
 */
export type LayerFeaturesFilters = Map<FeatureTypeName, CQLFilter>;

/**
 * Top-level grouping of filters by layer ID.
 * Maps layer IDs to LayerFeaturesFilters, creating a nested Map structure where:
 * - First level: Layer ID → LayerFeaturesFilters
 * - Second level: Feature Type Name → CQL Filter
 */
export type FeaturesFilters = Map<LayerId, LayerFeaturesFilters>;
