import { ComponentBaseConfigModel } from '../component-base-config.model';

export const MOUSE_COORDINATES_MAP_PROJECTION = 'map';

export type MouseCoordinatesFormat = 'xy' | 'decimal-degrees' | 'degrees-decimal-minutes';

export interface MouseCoordinatesDisplayConfigModel {
  id: string;
  projection: string;
  format: MouseCoordinatesFormat;
}

export interface MouseCoordinatesConfigModel extends ComponentBaseConfigModel {
  displays?: MouseCoordinatesDisplayConfigModel[];
}
