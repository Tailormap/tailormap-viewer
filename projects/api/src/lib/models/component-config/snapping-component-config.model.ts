import { ComponentBaseConfigModel } from '../component-base-config.model';

export const DEFAULT_SNAPPING_TOLERANCE = 10;

export interface SnappingComponentConfigModel extends ComponentBaseConfigModel {
  tolerance?: number;
  selectedLayers?: string[];
}
