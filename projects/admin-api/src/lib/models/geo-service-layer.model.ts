export interface GeoServiceLayerModel {
  id: string;
  name: string;
  root: boolean;
  title: string;
  virtual: boolean;
  crs: string[];
  maxScale?: number;
  minScale?: number;
  abstractText: string;
  children: string[] | null;
}
