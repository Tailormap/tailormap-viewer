import { ComponentBaseConfigModel } from '../component-base-config.model';

export interface CoordinateLinkWindowConfigUrlModel {
  id: string;
  url: string;
  alias: string;
  projection: string;
}

export interface CoordinateLinkWindowConfigModel extends ComponentBaseConfigModel {
  urls: CoordinateLinkWindowConfigUrlModel[];
}
