import { OpenlayersExtent } from './extent.type';

export interface MapViewerOptionsModel {
  projection: string;
  projectionAliases?: string[];
  projectionDefinition: string;
  maxExtent: OpenlayersExtent;
  initialExtent?: OpenlayersExtent;
}
