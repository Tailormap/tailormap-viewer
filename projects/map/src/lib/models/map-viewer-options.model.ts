import { OpenlayersExtent } from './extent.type';

export interface MapViewerOptionsModel {
  projection: string;
  projectionDefinition: string;
  maxExtent: OpenlayersExtent;
}
