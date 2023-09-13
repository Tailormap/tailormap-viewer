import { Geometry } from 'ol/geom';
import { Feature } from 'ol';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';

export type FeatureModelType<T extends FeatureModelAttributes = FeatureModelAttributes> = string | FeatureModel<T> | Geometry | Feature<Geometry> | null;
