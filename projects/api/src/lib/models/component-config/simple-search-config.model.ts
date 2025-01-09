import { ComponentBaseConfigModel } from '../component-base-config.model';

export interface SimpleSearchConfigModel extends ComponentBaseConfigModel {
  municipalities?: string[];
}
