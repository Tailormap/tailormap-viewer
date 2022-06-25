export interface AttributeListTabModel {
  id: string;
  label: string;
  layerId?: number;
  selectedDataId: string;
  initialDataLoaded: boolean;
  loadingData: boolean;
  loadingError?: string;
}
