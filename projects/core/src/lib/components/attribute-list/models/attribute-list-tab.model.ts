export interface AttributeListTabModel {
  id: string;
  label: string;
  tabSourceId: string;
  layerId?: string;
  selectedDataId: string;
  initialDataId: string;
  initialDataLoaded: boolean;
  loadingData: boolean;
  loadingError?: string;
}
