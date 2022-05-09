import Geometry from 'ol/geom/Geometry';
import Feature from 'ol/Feature';
import { FeatureModel } from '@tailormap-viewer/api';

export type FeatureModelType = string | FeatureModel | Geometry | Feature<Geometry> | null;
