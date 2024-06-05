import { ComponentBaseConfigModel } from '../component-base-config.model';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';

export interface CoordinateLinkWindowConfigUrlModel {
  id: string;
  url: string;
  alias: string;
  projection: ProjectionCodesEnum;
}

export interface CoordinateLinkWindowConfigModel extends ComponentBaseConfigModel {
  urls: CoordinateLinkWindowConfigUrlModel[];
}
