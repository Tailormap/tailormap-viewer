import Geometry from 'ol/geom/Geometry';
import Feature from 'ol/Feature';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';

export type FeatureModelType<T extends FeatureModelAttributes = FeatureModelAttributes> = string | FeatureModel<T> | Geometry | Feature<Geometry> | null;
