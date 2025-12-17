export interface AttributeListTabModel {
  id: string;
  label: string;
  tabSourceId: string;
  layerId?: string;
  featureType?: string;
  selectedDataId: string;
  initialDataLoaded: boolean;
  loadingData: boolean;
  loadingError?: string;
}
