export interface AttributeListTabModel {
  id: string;
  label: string;
  layerName?: string;
  selectedDataId: string;
  initialDataLoaded: boolean;
  loadingData: boolean;
  loadingError?: string;
}
