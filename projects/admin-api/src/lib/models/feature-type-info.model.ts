import { BoundsModel } from '@tailormap-viewer/api';

export interface FeatureTypeInfoModel {
  keywords?: string;
  description?: string;
  publisher?: string;
  schema?: 'http://tailormap.nl/geodata/oracle/';
  source?: string;
  bounds?: BoundsModel;
  crs?: string;
  wgs84BoundingBox?: BoundsModel;
  defaultSrs?: string;
  otherSrs?: string[];
  outputFormats?: string[];
  abstractText?: string;
}
