import { OpenlayersExtent } from './extent.type';

export interface MapViewerControlOptionsModel {
  attributionPosition?: 'left' | 'right';
}

export interface MapViewerOptionsModel {
  projection: string;
  projectionAliases?: string[];
  projectionDefinition: string;
  maxExtent: OpenlayersExtent;
  initialExtent?: OpenlayersExtent;
  controlOptions?: MapViewerControlOptionsModel;
}
