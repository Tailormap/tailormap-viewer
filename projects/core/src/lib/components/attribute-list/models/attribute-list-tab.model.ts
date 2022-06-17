export interface AttributeListTabModel {
  id: string;
  label: string;
  layerId?: string;
  initialDataLoaded: boolean;
  loadingData: boolean;
  loadingError?: string;
}
