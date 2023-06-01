export interface GeoServiceLayerModel {
  id: string;
  name: string;
  root: boolean;
  title: string;
  virtual: boolean;
  maxScale?: number;
  minScale?: number;
  abstractText: string;
  children: string[] | null; // list of names of GeoServiceLayerModels
}
