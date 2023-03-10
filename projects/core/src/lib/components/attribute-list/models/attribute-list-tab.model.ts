export interface AttributeListTabModel {
  id: string;
  label: string;
  layerId?: string;
  selectedDataId: string;
  initialDataLoaded: boolean;
  loadingData: boolean;
  loadingError?: string;
}
