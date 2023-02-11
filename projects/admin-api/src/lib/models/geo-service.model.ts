import { GeoServiceLayerModel } from './geo-service-layer.model';
import { ServiceCapsModel } from './service-caps.model';
import { GeoServiceProtocolEnum } from './geo-service-protocol.enum';

export interface GeoServiceModel {
  id: string;
  adminComments: string;
  protocol: GeoServiceProtocolEnum;
  url: string;
  authentication: Record<string, any>;
  capabilities: Blob;
  capabilitiesContentType: string;
  capabilitiesFetched: string;
  title: string;
  advertisedUrl: string;
  serviceCapabilities: ServiceCapsModel;
  layers: GeoServiceLayerModel[];
  settings: Record<string, any>;
  layerSettings: Record<string, any>;
  tileServiceInfo: Record<string, any>;
}
