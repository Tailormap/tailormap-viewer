import { OpenlayersExtent } from './extent.type';

export interface MapViewerOptionsModel {
  projection: string;
  maxExtent: OpenlayersExtent;
  initialExtent?: OpenlayersExtent;
}
